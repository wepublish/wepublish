const Docker = require("dockerode");
const stream = require("stream");
const { execFile } = require("child_process");
const { createWriteStream } = require("fs");
const { mkdir } = require("fs/promises");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

async function buildImage(tag, contextDir, dockerfile, logDirPath, buildArgs = {}) {
  await mkdir(logDirPath, { recursive: true });
  const logPath = `${logDirPath}/${tag}-img.log`;
  const log = createWriteStream(logPath);
  const argFlags = Object.entries(buildArgs).flatMap(
    ([k, v]) => ["--build-arg", `${k}=${v}`]
  );
  console.log(`building image: '${tag}'. consult logs here: ${logPath}`);

  try {
    await new Promise((resolve, reject) => {
      const child = execFile(
        "docker",
        ["build", "-t", tag, ...argFlags, "-f", dockerfile, contextDir],
        (err) => (err ? reject(err) : resolve())
      );
      child.stdout.pipe(log);
      child.stderr.pipe(log);
    });
  } finally {
    log.end();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(fn, interval = 500) {
  while (!(await fn())) await sleep(interval);
}

async function inspectContainer(idOrName) {
  try {
    return await docker.getContainer(idOrName).inspect();
  } catch (err) {
    if (err.statusCode === 404) return null;
    throw err;
  }
}

async function createContainer(opts) {
  const container = await docker.createContainer(opts);
  return container.id;
}

async function createContainerIfNonExistent(opts) {
  const existing = await inspectContainer(opts.name);
  if (existing) {
    console.log(`Container ${opts.name} already exists, reusing it`);
    return existing.Id;
  }
  const container = await docker.createContainer(opts);
  console.log(`Created container ${opts.name}`);
  return container.id;
}

async function startContainer(idOrName) {
  await docker.getContainer(idOrName).start();
}

async function attachContainer(idOrName, stdout = process.stdout, stderr = process.stderr) {
  const execStream = await docker.getContainer(idOrName).attach({
    stream: true,
    stdout: true,
    stderr: true,
  });
  docker.modem.demuxStream(execStream, stdout, stderr);
  return execStream;
}

async function waitContainer(idOrName) {
  return docker.getContainer(idOrName).wait();
}

async function stopContainer(idOrName) {
  const info = await inspectContainer(idOrName);
  if (info?.State.Running) {
    await docker.getContainer(idOrName).stop();
  }
}

async function removeContainer(idOrName, { force = true } = {}) {
  const info = await inspectContainer(idOrName);
  if (!info) return;
  await docker.getContainer(idOrName).remove({ force });
}

function collectStream(execStream) {
  return new Promise((resolve, reject) => {
    const out = [];
    const err = [];
    const outStream = new stream.PassThrough();
    const errStream = new stream.PassThrough();
    outStream.on("data", (chunk) => out.push(chunk));
    errStream.on("data", (chunk) => err.push(chunk));

    docker.modem.demuxStream(execStream, outStream, errStream);

    execStream.on("end", () =>
      resolve({
        stdout: Buffer.concat(out).toString(),
        stderr: Buffer.concat(err).toString(),
      })
    );
    execStream.on("error", reject);
  });
}

async function execInContainer(idOrName, cmd) {
  const container = docker.getContainer(idOrName);
  const e = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  });

  const execStream = await e.start({ hijack: true, stdin: false });
  const { stdout, stderr } = await collectStream(execStream);

  const { ExitCode } = await e.inspect();
  return { exitCode: ExitCode, stdout, stderr };
}

module.exports = {
  waitUntil,
  inspectContainer,
  createContainer,
  createContainerIfNonExistent,
  startContainer,
  attachContainer,
  stopContainer,
  removeContainer,
  waitContainer,
  execInContainer,
  buildImage,
};
