#!/usr/bin/env node

import { createWriteStream } from 'fs';

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      result[argv[i]] =
        argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

const ENDPOINT = args['--endpoint'] ?? 'https://api-review02.wepublish.works/v1';
const OUTPUT_FILE = args['--output'] ?? 'comments.json';
const EMAIL = args['--email'];
const PASSWORD = args['--password'];
const TOTP = args['--totp'];
const BATCH_SIZE = 100;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Usage: node scripts/31-download-echos.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--output <file>]'
  );
  process.exit(1);
}

const QUERY = `
  query DownloadComments($cursor: String, $take: Int) {
    comments(cursorId: $cursor, take: $take) {
      nodes {
        id
        createdAt
        modifiedAt
        itemID
        itemType
        state
        rejectionReason
        authorType
        source
        featured
        parentID
        guestUsername
        title
        lead
        text
        tags {
          id
          tag
          url
          main
        }
        revisions {
          title
          lead
          text
          createdAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

async function gql(query, variables, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data;
}

async function login() {
  const data = await gql(
    `mutation CreateSession($email: String!, $password: String!, $totpToken: String) {
      createSession(email: $email, password: $password, totpToken: $totpToken) {
        token
      }
    }`,
    { email: EMAIL, password: PASSWORD, totpToken: TOTP ?? null }
  );
  return data.createSession.token;
}

async function fetchComments(cursor, token) {
  const data = await gql(QUERY, { cursor, take: BATCH_SIZE }, token);
  return data.comments;
}

function writeChunk(stream, data) {
  return new Promise((resolve, reject) => {
    const ok = stream.write(data);
    if (ok) {
      resolve();
    } else {
      const onDrain = () => { stream.removeListener('error', onError); resolve(); };
      const onError = err => { stream.removeListener('drain', onDrain); reject(err); };
      stream.once('drain', onDrain);
      stream.once('error', onError);
    }
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log();

  process.stdout.write('Logging in...');
  const token = await login();
  console.log(' done\n');

  const stream = createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

  let cursor = null;
  let totalCount = null;
  let fetched = 0;
  let page = 1;
  let firstComment = true;

  await writeChunk(stream, '{\n');

  while (true) {
    const pageStart = Date.now();
    const result = await fetchComments(cursor, token);
    const pageMs = Date.now() - pageStart;

    if (totalCount === null) {
      totalCount = result.totalCount;
      const header =
        `  "downloadedAt": ${JSON.stringify(new Date().toISOString())},\n` +
        `  "endpoint": ${JSON.stringify(ENDPOINT)},\n` +
        `  "totalCount": ${totalCount},\n` +
        `  "comments": [\n`;
      await writeChunk(stream, header);
    }

    for (const comment of result.nodes) {
      const prefix = firstComment ? '    ' : ',\n    ';
      await writeChunk(stream, prefix + JSON.stringify(comment, null, 4));
      firstComment = false;
    }

    fetched += result.nodes.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = ((fetched / totalCount) * 100).toFixed(1);
    const pages = Math.ceil(totalCount / BATCH_SIZE);
    const eta =
      fetched < totalCount ?
        Math.round(
          (((Date.now() - startTime) / fetched) * (totalCount - fetched)) / 1000
        )
      : 0;

    process.stdout.write(
      `\r  Page ${String(page).padStart(4)}/${pages}  ` +
        `${String(fetched).padStart(6)}/${totalCount} comments  ` +
        `${pct.padStart(5)}%  ` +
        `${pageMs}ms/req  ` +
        `${elapsed}s elapsed  ` +
        (fetched < totalCount ? `ETA ~${eta}s` : 'done    ')
    );

    if (!result.pageInfo.hasNextPage) {
      break;
    }

    cursor = result.pageInfo.endCursor;
    page++;
  }

  await writeChunk(stream, '\n  ]\n}\n');

  await new Promise((resolve, reject) => {
    stream.end(err => (err ? reject(err) : resolve()));
  });

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n\nWrote ${fetched} comments to ${OUTPUT_FILE} in ${totalSec}s`
  );
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
