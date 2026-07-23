const fs = require("fs/promises");
require("dotenv").config();

async function pullDbDump(medium) {
  const { USERNAME, PASSWORD } = process.env;
  if (!USERNAME || !PASSWORD) {
    throw new Error("USERNAME and PASSWORD for files.wepublish.cloud must be set as env variables");
  }

  const url = `https://files.wepublish.cloud/${medium}.sql.gz`;
  const dumpFilePath = `${medium}/dump.sql.gz`;
  const metaFilePath = `${medium}/dump.meta.json`;

  console.log(`Pulling latest database dump for ${medium}`);

  let meta = {};
  try {
    meta = JSON.parse(await fs.readFile(metaFilePath, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
  const res = await fetch(url, {
    headers: {
      "Authorization": `Basic ${credentials}`,
      ...(meta.etag && { "If-None-Match": meta.etag }),
      ...(meta.lastModified && { "If-Modified-Since": meta.lastModified }),
    },
  });

  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to download dump: ${res.status} ${res.statusText}`);
  }

  if (res.status === 304) {
    console.log("db dump already downloaded — skipped");
    return dumpFilePath;
  }

  const total = Number(res.headers.get("content-length")) || 0;
  let loaded = 0;
  const chunks = [];

  for await (const chunk of res.body) {
    chunks.push(chunk);
    loaded += chunk.byteLength;
    if (total) {
      process.stdout.write(`\rDownloading db dump... ${((loaded / total) * 100).toFixed(1)}%`);
    } else {
      process.stdout.write(`\rDownloading db dump... ${(loaded / 1024).toFixed(1)} KB`);
    }
  }

  await fs.writeFile(dumpFilePath, Buffer.concat(chunks));
  await fs.writeFile(metaFilePath, JSON.stringify({
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
  }, null, 2));

  console.log("\nDownloaded and saved db dump");
  return dumpFilePath;
}

module.exports = { pullDbDump };
