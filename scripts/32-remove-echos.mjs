#!/usr/bin/env node

import { readFileSync } from 'fs';

const INPUT_FILE = new URL('../comments.json', import.meta.url).pathname;
const TARGET_DATES = ['2026-04-01', '2026-03-31', '2026-03-30'];

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

const ENDPOINT =
  args['--endpoint'] ?? 'https://api-review02.wepublish.works/v1';
const EMAIL = args['--email'];
const PASSWORD = args['--password'];
const TOTP = args['--totp'];
const DRY_RUN = '--dry-run' in args;

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
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

async function main() {
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Input file:  ${INPUT_FILE}`);
  console.log(`Target dates: ${TARGET_DATES.join(', ')}`);
  console.log(`Dry run:     ${DRY_RUN}`);
  console.log();

  const data = JSON.parse(readFileSync(INPUT_FILE, 'utf8'));
  const allComments = data.comments;

  const targets = allComments.filter(c =>
    TARGET_DATES.some(date => c.createdAt.startsWith(date))
  );

  console.log(`Total comments in file: ${allComments.length}`);
  console.log(`Comments from ${TARGET_DATES.join(', ')}: ${targets.length}`);

  if (targets.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  console.log();
  for (const c of targets) {
    console.log(`  ${c.id}  ${c.createdAt}  ${c.itemType}/${c.itemID}`);
  }
  console.log();

  if (DRY_RUN) {
    console.log('Dry run — no changes will be made.');
    return;
  }

  if (!EMAIL || !PASSWORD) {
    console.error(
      'Credentials required for deletion. Usage: node scripts/32-remove-echos.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--dry-run]'
    );
    process.exit(1);
  }

  process.stdout.write('Logging in...');
  const token = await login();
  console.log(' done\n');

  let done = 0;
  let errors = 0;
  const errorList = [];

  for (const comment of targets) {
    try {
      await gql(DELETE_MUTATION, { id: comment.id }, token);
    } catch (err) {
      errors++;
      errorList.push({ id: comment.id, error: err.message });
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
