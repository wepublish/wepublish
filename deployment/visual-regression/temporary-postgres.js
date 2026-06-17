const { createContainer, startContainer, removeContainer, inspectContainer, buildImage, execInContainer, waitUntil } = require("./docker-api.js");

const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DB_NAME = "wepublish";
const POSTGRESQL_PORT = "5432/tcp";

async function getDatabasePort(containerId) {
  const info = await inspectContainer(containerId);
  if (!info) {
    throw new Error("Container not found!");
  }

  const bindings = info.NetworkSettings.Ports?.[POSTGRESQL_PORT];
  if (!bindings || bindings.length === 0) {
    throw new Error(`No host binding for ${POSTGRESQL_PORT}!`);
  }

  const binding =
    bindings.find((b) => b.HostIp === "0.0.0.0") ?? bindings[0];

  const hostPort = binding.HostPort;
  if (!hostPort) {
    throw new Error("HostPort not found!");
  }
  return hostPort;
}

async function getDbConnectionString(dbContainerId) {
  const hostPort = await getDatabasePort(dbContainerId);
  const dbConnectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${hostPort}/${DB_NAME}`;
  return { dbConnectionString, containerId: dbContainerId };
}

async function buildPostgresImg(medium, logDirPath) {
  await buildImage(`postgres-temp-${medium}`, ".", "Dockerfile", logDirPath, { MEDIUM: medium });
}

async function createPostgresContainer(
  medium,
  postfix
) {
  const containerName = `postgres-temp-${medium}-${postfix}`;
  const config = {
    name: containerName,
    Image: `postgres-temp-${medium}`,
    HostConfig: {
      // Bind it to a free, random port (makes getDatabasePort necessary)
      PortBindings: { [POSTGRESQL_PORT]: [{ HostPort: "" }] }
    }
  };
  await removeContainer(containerName);
  const containerId = await createContainer(config);
  console.log(`postgres container for ${postfix} created`);
  return containerId;
}

async function startPostgresContainer(containerId) {
  await startContainer(containerId);
  return containerId;
}

async function isPostgresReady(containerId) {
  const info = await inspectContainer(containerId);
  if (!info) throw new Error("Container not found");
  if (info.State.Status === "exited" || info.State.Status === "dead") {
    throw new Error(`Container failed with exit code ${info.State.ExitCode} `);
  }
  try {
    const { exitCode } = await execInContainer(containerId, ["pg_isready", "-U", DB_USER]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function waitUntilPostgresIsReady(containerId) {
  await waitUntil(() => isPostgresReady(containerId));
  return containerId;
}

module.exports = {
  buildPostgresImg,
  getDbConnectionString,
  createPostgresContainer,
  startPostgresContainer,
  waitUntilPostgresIsReady
};
