import { readFileSync } from 'fs';

const RUECKSPIEGEL_PATH = new URL('../rueckspiegel.json', import.meta.url)
  .pathname;

const args = parseArgs(process.argv.slice(2));

const ENDPOINT =
  args['--endpoint'] ?? 'https://api-review02.wepublish.works/v1';
const EMAIL = args['--email'];
const PASSWORD = args['--password'];
const TOTP = args['--totp'];
const DRY_RUN = '--dry-run' in args;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Usage: node scripts/12-publish-rueckspiegel.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--dry-run]'
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

const PUBLISH_MUTATION = `
    mutation PublishArticle($id: String!, $publishedAt: DateTime!) {
        publishArticle(id: $id, publishedAt: $publishedAt) {
            id
        }
    }
`;

const BASE_DATE = new Date('2010-01-01T00:00:00.000Z');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function publishedAtForIndex(index, total) {
  // index 0 (oldest createdAt) → BASE_DATE; index total-1 (newest createdAt) → BASE_DATE + (total-1) days
  const daysOffset = index;
  return new Date(BASE_DATE.getTime() + daysOffset * ONE_DAY_MS).toISOString();
}

async function main() {
  console.log(`Endpoint:  ${ENDPOINT}`);
  console.log(`Email:     ${EMAIL}`);
  console.log(`Dry run:   ${DRY_RUN}`);
  console.log();

  console.log('Reading rueckspiegel.json...');
  const articles = JSON.parse(readFileSync(RUECKSPIEGEL_PATH, 'utf8')).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const total = articles.length;
  console.log(`Total articles: ${total}`);
  console.log(
    `Date range:     ${publishedAtForIndex(total - 1, total)} → ${publishedAtForIndex(0, total)}`
  );
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

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const publishedAt = publishedAtForIndex(i, total);

    try {
      await gql(PUBLISH_MUTATION, { id: article.id, publishedAt }, token);
    } catch (err) {
      errors++;
      errorList.push({ id: article.id, error: err.message });
    }
    process.stdout.write(`\r  ${++done}/${total} (${errors} errors)`);
  }

  console.log();
  console.log();
  console.log(`Done. ${done - errors} republished, ${errors} errors.`);

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
