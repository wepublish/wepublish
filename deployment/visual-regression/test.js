const { getProjectRootDir, createWorkTree } = require("./git.js");
const fs = require("fs/promises");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { pullDbDump } = require("./pull-db-dump.js");
const { buildPostgresImg, createPostgresContainer, startPostgresContainer, getDbConnectionString, waitUntilPostgresIsReady } = require("./temporary-postgres.js");
const { startProject, teardownProcesses, getFreePort } = require("./processes.js");
const path = require('path');
const { createContainer, startContainer, attachContainer, buildImage, removeContainer, waitContainer } = require("./docker-api.js");

function createScreenshotContainerConfig(
  medium,
  baselineCommit,
  currentCommit,
  baselineUiPort,
  currentUiPort,
) {
  const artifactsPath = `./${medium}/artifacts`;
  const hostConfig = {
    Init: true,
    IpcMode: "host",
    Binds: [`${path.resolve(artifactsPath)}:/app/artifacts`],
  };
  const isLinux = process.platform === "linux";
  if (isLinux) {
    // Share the host net namespace: container's localhost == host's localhost.
    // we need this to be able to reach the ui inside the container
    hostConfig.NetworkMode = "host";
  } else {
    // macOS: reach the host via the Docker-provided alias.
    //probably works on Windows as well, not tested
    hostConfig.ExtraHosts = ["host.docker.internal:host-gateway"];
  }
  const host = isLinux ? "localhost" : "host.docker.internal";
  return {
    name: `${medium}-screenshots`,
    Image: `${medium}-screenshots`,
    Env: [
      `ARTIFACTS_PATH=${path.resolve(artifactsPath)}`,
      `BASELINE_COMMIT=${baselineCommit}`,
      `CURRENT_COMMIT=${currentCommit}`,
      `HOST=${host}`,
      `BASELINE_PORT=${baselineUiPort}`,
      `CURRENT_PORT=${currentUiPort}`,
    ],
    HostConfig: hostConfig,
  };
}

async function createScreenshotContainer(medium, baselineCommit, currentCommit, baselineUiPort, currentUiPort) {
  const containerConfig = createScreenshotContainerConfig(
    medium,
    baselineCommit,
    currentCommit,
    baselineUiPort,
    currentUiPort
  );
  await removeContainer(`${medium}-screenshots`);
  const containerId = await createContainer(containerConfig);
  console.log(`screenshot container created`);
  return containerId;
}


async function deleteAndCreateFolder(folderPath) {
  await fs.rm(folderPath, { recursive: true, force: true });
  await fs.mkdir(folderPath, { recursive: true });
}

async function deleteAndCreateFolders(paths) {
  return Promise.all(paths.map(deleteAndCreateFolder));
}

async function npmInstall(cwd) {
  console.log(`run npm install in ${cwd} `);
  await exec("npm install", { cwd });
}

async function migrateDatabase(dbConnectionString, cwd, logDir) {
  const { stdout, stderr } = await exec("npx prisma migrate deploy ", {
    env: {
      ...process.env, DATABASE_URL: dbConnectionString, DIRECT_DATABASE_URL: dbConnectionString
    }, cwd
  });
  await fs.writeFile(path.join(logDir, "prisma-migrate.out.log"), stdout);
  await fs.writeFile(path.join(logDir, "prisma-migrate.err.log"), stderr);
}

function setupSide(medium, label, commitHash, dir, apiPort, uiPort, postgresImgPromise, logPath) {
  const dbPromise = postgresImgPromise
    .then(() => createPostgresContainer(medium, label))
    .then(startPostgresContainer)
    .then(waitUntilPostgresIsReady)
    .then(getDbConnectionString);
  const codePromise = createWorkTree(commitHash, dir).then(() => {
    console.log(`running npm install in '${label}' work tree`);
    return npmInstall(dir);
  });
  const runningPromise = Promise.all([dbPromise, codePromise])
    .then(([{ dbConnectionString }]) => {
      console.log(`running database migration for ${label}`);
      return migrateDatabase(dbConnectionString, dir, logPath)
        .then(() => startProject(logPath, dir, dbConnectionString, medium, apiPort, uiPort));
    });
  return { dbPromise, runningPromise };
};

async function main(medium, baselineCommitHash, currentCommitHash) {
  if (!medium || !baselineCommitHash || !currentCommitHash) {
    console.error(
      "Missing required environment variables.\n" +
      "Required: MEDIUM, BASELINE_COMMIT_HASH, CURRENT_COMMIT_HASH"
    );
    process.exit(1);
  }

  const apiPortBaseline = await getFreePort();
  const apiPortCurrent = await getFreePort();
  const uiPortBaseline = await getFreePort();
  const uiPortCurrent = await getFreePort();
  const logPathCurrent = `${medium}/logs/current`;
  const logPathBaseline = `${medium}/logs/baseline`;
  const artifactsPath = `${medium}/artifacts`;
  const root = await getProjectRootDir();
  const baselineDir = path.resolve(`${root}/../wp-baseline`);
  const currentDir = path.resolve(`${root}/../wp-current`);
  console.log(`starting visual regression tool for ${medium}. baseline is ${baselineCommitHash}, compare against ${currentCommitHash}`);
  await deleteAndCreateFolders([logPathCurrent, logPathBaseline, artifactsPath]);
  const screenshotContainerPromise = buildImage(`${medium}-screenshots`, ".", `${medium}-scripts/Dockerfile`, `${medium}/logs`).then(() =>
    createScreenshotContainer(medium, baselineCommitHash, currentCommitHash, uiPortBaseline, uiPortCurrent));
  const postgresImgPromise = pullDbDump(medium)
    .then(() => buildPostgresImg(medium, `${medium}/logs`));
  const { dbPromise: baselineDbPromise, runningPromise: baselineRunningPromise } =
    setupSide(medium, "baseline", baselineCommitHash, baselineDir, apiPortBaseline, uiPortBaseline, postgresImgPromise, logPathBaseline);
  const { dbPromise: currentDbPromise, runningPromise: currentRunningPromise } =
    setupSide(medium, "current", currentCommitHash, currentDir, apiPortCurrent, uiPortCurrent, postgresImgPromise, logPathCurrent);
  const [
    containerIdScreenshots,
    { containerId: containerIdDbBaseline },
    { containerId: containerIdDbCurrent },
    [apiProcessBaseline, uiProcessBaseline],
    [apiProcessCurrent, uiProcessCurrent]
  ] = await Promise.all([
    screenshotContainerPromise,
    baselineDbPromise,
    currentDbPromise,
    baselineRunningPromise,
    currentRunningPromise
  ]);

  try {
    console.log("running regression tests now...");
    await attachContainer(containerIdScreenshots);
    await startContainer(containerIdScreenshots);
    await waitContainer(containerIdScreenshots);
  } finally {
    await Promise.all([
      teardownProcesses([apiProcessBaseline, uiProcessBaseline, apiProcessCurrent, uiProcessCurrent]),
      removeContainer(containerIdDbBaseline), removeContainer(containerIdDbCurrent), removeContainer(containerIdScreenshots)
    ]);
  }
}

main(process.env.MEDIUM, process.env.BASELINE_COMMIT_HASH, process.env.CURRENT_COMMIT_HASH);
