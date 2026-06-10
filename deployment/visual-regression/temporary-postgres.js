const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const docker = require("./docker-api.js");
const zlib = require("zlib");
const { promisify } = require("util");
const gunzip = promisify(zlib.gunzip);

const CONTAINER_PREFIX = "temp-postgres";
const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DB_NAME = "wepublish";
const POSTGRESQL_PORT = "5432/tcp";

async function createContainerConfig(containerPostfix) {
  return {
    name: `${CONTAINER_PREFIX}-${containerPostfix}`,
    platform: "linux/amd64",
    Image: "postgres:17",
    Env: [
      `POSTGRES_USER=${DB_USER}`,
      `POSTGRES_PASSWORD=${DB_PASSWORD}`,
      `POSTGRES_DB=${DB_NAME}`,
      "POSTGRES_HOST_AUTH_METHOD=trust",
    ],
    HostConfig: {
      PortBindings: { [POSTGRESQL_PORT]: [{ HostPort: "" }] },
      Binds: [`${os.tmpdir()}:/dump`],
      // Mount the data directory as tmpfs (in-memory) so it's never persisted to disk
      // each container run starts with a fresh, empty database.
      Tmpfs: { "/var/lib/postgresql/data": "" },
    },
  };
}

async function isPostgresReady(containerId) {
  const info = await docker.inspectContainer(containerId);
  if (!info) throw new Error("Container not found");
  if (info.State.Status === "exited" || info.State.Status === "dead") {
    throw new Error(`Container failed with exit code ${info.State.ExitCode} `);
  }
  try {
    const { exitCode } = await docker.exec(containerId, ["pg_isready", "-U", DB_USER]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function getDatabasePort(containerId) {
  const info = await docker.inspectContainer(containerId);
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

async function seedDatabase(containerId, dumpFile, postfix) {
  console.log(`Seeding database for ${postfix}...`);
  const dump = await gunzip(await fs.readFile(dumpFile));
  const fileName = `dump-${postfix}.sql`;
  const tmpFile = path.join(os.tmpdir(), fileName);
  await fs.writeFile(tmpFile, dump);

  try {
    const { exitCode, stdout, stderr } = await docker.exec(containerId, [
      "psql", "-U", DB_USER, "-d", DB_NAME, "-f", `/dump/${fileName}`,
    ]);

    if (exitCode !== 0) {
      console.error("psql output:", stderr || stdout);
      throw new Error(`psql failed with exit code ${exitCode}`);
    }
  } finally {
    await fs.unlink(tmpFile);
  }
  console.log(`Done seeding ${postfix}.`);

  const hostPort = await getDatabasePort(containerId);
  return `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${hostPort}/${DB_NAME}`;
}

async function startAndSeedDb(dumpFile, postfix) {
  const containerConfig = await createContainerConfig(postfix);
  await docker.removeContainer(containerConfig.name);

  console.log(`Creating and starting postgreSQL container for ${postfix}...`);
  const containerId = await docker.createContainer(containerConfig);
  await docker.startContainer(containerId);

  console.log(`Waiting for postgreSQL container (${postfix}) to be ready...`);
  await docker.waitUntil(() => isPostgresReady(containerId));

  const dbConnectionString = await seedDatabase(containerId, dumpFile, postfix);
  return { containerId, dbConnectionString };
}

module.exports = {
  startAndSeedDb,
  removePostgresContainer: () => docker.removeContainer(CONTAINER),
};
