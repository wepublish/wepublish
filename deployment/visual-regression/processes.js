const { promisify } = require('util');
const fs = require('fs/promises');
const fsSync = require('fs');
const { exec, spawn } = require('child_process');
const { createServer } = require('node:net');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const execAsync = promisify(exec);

async function killPortIfOccupied(port) {
  try {
    const { stdout } = await execAsync(`ss -lptn 'sport = :${port}'`);
    const match = stdout.match(/pid=(\d+)/);
    if (match) {
      const pid = Number(match[1]);
      process.kill(pid, 'SIGKILL');
      console.log(`Killed process ${pid} occupying port ${port}`);
    }
  } catch {
    // No process on that port, nothing to do
  }
}

function spawnAndWaitFor(
  cmd,
  args,
  readyString,
  logPrefix,
  env = {},
  cwd = process.cwd()
) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const proc = spawn(cmd, args, {
      env: { ...process.env, ...env },
      cwd,
      detached: true,
    });

    const stdoutLog = fsSync.createWriteStream(`${logPrefix}.out.log`, {
      flags: 'w',
    });
    const stderrLog = fsSync.createWriteStream(`${logPrefix}.err.log`, {
      flags: 'w',
    });

    proc.stdout.on('data', data => {
      stdoutLog.write(data);
      if (!resolved && data.toString().includes(readyString)) {
        resolved = true;
        resolve(proc);
      }
    });
    proc.stderr.on('data', data => {
      stderrLog.write(data);
      if (!resolved && data.toString().includes(readyString)) {
        resolved = true;
        resolve(proc);
      }
    });

    proc.on('error', error => {
      console.error(`Process '${cmd} with args: ${args}' exited with ${error}`);
      reject(error);
    });

    proc.on('exit', code => {
      stdoutLog.end();
      stderrLog.end();
      if (!resolved)
        reject(
          new Error(
            `Process '${cmd} with args: ${args}' exited with code ${code}`
          )
        );
    });
  });
}

function teardownProcesses(processes) {
  for (const p of processes) {
    try {
      process.kill(-p.pid, 'SIGKILL');
    } catch {
      // already dead, ignore
    }
  }
}

async function startApi(
  jwtPublicKey,
  jwtPrivateKey,
  mediaServerUrl,
  dbConnectionString,
  logDir,
  workTreeDir,
  port
) {
  console.log(`starting api on ${port}...`);
  return spawnAndWaitFor(
    'npx',
    ['nx', 'serve', 'api-example', '--verbose'],
    'Public api is running on',
    `${logDir}/api-example`,
    {
      JWT_PUBLIC_KEY: jwtPublicKey,
      JWT_PRIVATE_KEY: jwtPrivateKey,
      MEDIA_SERVER_URL: mediaServerUrl,
      DATABASE_URL: dbConnectionString,
      PORT: port,
      NX_DAEMON: false, // we don't want to be affected by daemon crashes
    },
    workTreeDir
  );
}

async function startUi(medium, logDir, workTreeDir, port, apiPort) {
  console.log(`building ui`);
  const apiUrl = `http://localhost:${apiPort}`;

  await execAsync(`npx nx build ${medium} --verbose`, {
    cwd: workTreeDir,
    env: {
      ...process.env,
      /*
       * We start the build and API in parallel instead of gating the build on an API
       * readiness check. The build doesn't hit the API until partway through, by which
       * point it's normally up — so we skip the startup wait on every run.
       * Accepted risk: a slow API start means the in-build request fails and the build
       * must be retried.
       */
      API_URL: apiUrl,
      NX_DAEMON: false, // we don't want to be affected by daemon crashes
    },
  });
  console.log(`starting ui on ${port}...`);
  return spawnAndWaitFor(
    'npx',
    ['nx', 'run', `${medium}:serve:production`, `--port=${port}`, '--verbose'],
    'Ready in',
    `${logDir}/ui`,
    {
      API_URL: apiUrl,
      NX_DAEMON: false, // we don't want to be affected by daemon crashes
    },
    workTreeDir
  );
}

async function startProject(
  logDir,
  workTreeDir,
  dbConnectionString,
  medium,
  apiPort,
  uiPort
) {
  const { JWT_PUBLIC_KEY, JWT_PRIVATE_KEY } = process.env;
  if (!JWT_PUBLIC_KEY || !JWT_PRIVATE_KEY) {
    throw new Error(
      'JWT_PUBLIC_KEY and JWT_PRIVATE_KEY for the api server must be set as env variables'
    );
  }
  await Promise.all([
    fs.mkdir(logDir, { recursive: true }),
    killPortIfOccupied(apiPort),
    killPortIfOccupied(uiPort),
  ]);
  const mediaServerUrl = `https://media-${medium}.wepublish.cloud`;

  return Promise.all([
    startApi(
      JWT_PUBLIC_KEY,
      JWT_PRIVATE_KEY,
      mediaServerUrl,
      dbConnectionString,
      logDir,
      workTreeDir,
      apiPort
    ),
    startUi(medium, logDir, workTreeDir, uiPort, apiPort),
  ]);
}

async function stopProject(apiProcess, uiProcess) {
  teardownProcesses([apiProcess, uiProcess]);
}

module.exports = { startProject, stopProject, teardownProcesses, getFreePort };
