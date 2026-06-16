#!/usr/bin/env node

import { readFileSync } from 'fs';

const INPUT_FILE = new URL('../g-und-g.json', import.meta.url).pathname;

const args = parseArgs(process.argv.slice(2));

const ENDPOINT =
  args['--endpoint'] ?? 'https://api-review02.wepublish.works/v1';
const EMAIL = args['--email'];
const PASSWORD = args['--password'];
const TOTP = args['--totp'];
const DRY_RUN = '--dry-run' in args;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Usage: node scripts/22-remove-gesehen.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--dry-run]'
  );
  process.exit(1);
}

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
    throw new Error(`GraphQL: ${json.errors.map(e => e.message).join(', ')}`);
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

const DELETE_MUTATION = `
  mutation DeleteArticle($id: String!) {
    deleteArticle(id: $id)
  }
`;

async function main() {
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Input file:  ${INPUT_FILE}`);
  console.log(`Dry run:     ${DRY_RUN}`);
  console.log();

  const articles = JSON.parse(readFileSync(INPUT_FILE, 'utf8'));

  const targets = articles.filter(a => a.latest?.title === '«»');

  console.log(`Total articles in file: ${articles.length}`);
  console.log(`Articles with title "«»": ${targets.length}`);

  if (targets.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  console.log();
  for (const a of targets) {
    console.log(`  ${a.id}  ${a.publishedAt ?? a.createdAt}  ${a.url}`);
  }
  console.log();

  if (DRY_RUN) {
    console.log('Dry run — no changes will be made.');
    return;
  }

  process.stdout.write('Logging in...');
  const token = await login();
  console.log(' done');
  console.log();

  let done = 0;
  let errors = 0;
  const errorList = [];

  for (const article of targets) {
    try {
      await gql(DELETE_MUTATION, { id: article.id }, token);
    } catch (err) {
      errors++;
      errorList.push({ id: article.id, error: err.message });
    }
    process.stdout.write(`\r  ${++done}/${targets.length} (${errors} errors)`);
  }

  console.log();
  console.log();
  console.log(`Done. ${done - errors} deleted, ${errors} errors.`);

  if (errorList.length > 0) {
    console.log('\nErrors:');
    for (const { id, error } of errorList) {
      console.log(`  ${id}: ${error}`);
    }
  }
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
