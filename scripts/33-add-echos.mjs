#!/usr/bin/env node

import { readFileSync } from 'fs';

const ECHOS_FILE = new URL('../echos.json', import.meta.url).pathname;
const ARTICLES_FILE = new URL('../00-articles.json', import.meta.url).pathname;

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

const CREATE_MUTATION = `
  mutation CreateComment($itemID: String!, $itemType: CommentItemType!) {
    createComment(itemID: $itemID, itemType: $itemType) {
      id
    }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateComment($id: String!, $guestUsername: String, $revision: CommentRevisionInput) {
    updateComment(id: $id, guestUsername: $guestUsername, revision: $revision) {
      id
    }
  }
`;

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function htmlToSlate(html) {
  const paragraphs = html.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
  const nodes = paragraphs
    .map(p => decodeEntities(p.replace(/<[^>]+>/g, '').trim()))
    .filter(Boolean)
    .map(text => ({ type: 'paragraph', children: [{ text }] }));
  return nodes.length > 0 ?
      nodes
    : [{ type: 'paragraph', children: [{ text: '' }] }];
}

function buildArticleIndex(articles) {
  const index = new Map();
  for (const article of articles) {
    const m = article.slug?.match(/-(\d+)$/);
    if (m) {
      const uid = parseInt(m[1], 10);
      if (!index.has(uid)) index.set(uid, []);
      index.get(uid).push(article);
    }
  }
  return index;
}

function findArticle(echo, index) {
  const uid = parseInt(echo.parentid, 10);
  const candidates = index.get(uid) ?? [];
  if (candidates.length === 0)
    return { article: null, reason: 'no article with matching UID' };
  if (candidates.length === 1) return { article: candidates[0], reason: null };
  const match = candidates.find(
    a =>
      a.latest?.title
        .replace('«', '"')
        .replace('»', '"')
        .replace(/<br\s*\/?>/gi, '')
        .replace(' ', '') ===
      echo.parent_title.replace(/<br\s*\/?>/gi, '').replace(' ', '')
  );
  if (match) return { article: match, reason: null };
  return {
    article: null,
    reason: `${candidates.length} articles share UID ${uid}, none match title`,
  };
}

async function main() {
  console.log(`Endpoint:      ${ENDPOINT}`);
  console.log(`Echos file:    ${ECHOS_FILE}`);
  console.log(`Articles file: ${ARTICLES_FILE}`);
  console.log(`Dry run:       ${DRY_RUN}`);
  console.log();

  const echos = JSON.parse(readFileSync(ECHOS_FILE, 'utf8'));
  const articlesData = JSON.parse(readFileSync(ARTICLES_FILE, 'utf8'));
  const index = buildArticleIndex(articlesData.articles);

  const resolved = echos.map(echo => ({
    echo,
    ...findArticle(echo, index),
  }));

  const uploadable = resolved.filter(r => r.article !== null);
  const skipped = resolved.filter(r => r.article === null);

  console.log(`Total echos:      ${echos.length}`);
  console.log(`Uploadable:       ${uploadable.length}`);
  console.log(`Skipped:          ${skipped.length}`);

  if (skipped.length > 0) {
    console.log('\nSkipped echos:');
    for (const { echo, reason } of skipped) {
      console.log(`  uid=${echo.uid}  parentid=${echo.parentid}  ${reason}`);
    }
  }

  if (uploadable.length === 0) {
    console.log('\nNothing to upload.');
    return;
  }

  if (DRY_RUN) {
    console.log('\nDry run — no changes will be made.');
    return;
  }

  if (!EMAIL || !PASSWORD) {
    console.error(
      '\nCredentials required. Usage: node scripts/33-add-echos.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--dry-run]'
    );
    process.exit(1);
  }

  process.stdout.write('\nLogging in...');
  const token = await login();
  console.log(' done\n');

  let done = 0;
  let errors = 0;
  const errorList = [];

  for (const { echo, article } of uploadable) {
    try {
      const created = await gql(
        CREATE_MUTATION,
        { itemID: article.id, itemType: 'article' },
        token
      );
      await gql(
        UPDATE_MUTATION,
        {
          id: created.createComment.id,
          guestUsername: echo.author_name,
          revision: {
            title: echo.title,
            text: htmlToSlate(echo.text),
          },
        },
        token
      );
    } catch (err) {
      errors++;
      errorList.push({ uid: echo.uid, error: err.message });
    }
    process.stdout.write(
      `\r  ${++done}/${uploadable.length} (${errors} errors)`
    );
  }

  console.log();
  console.log();
  console.log(`Done. ${done - errors} uploaded, ${errors} errors.`);

  if (errorList.length > 0) {
    console.log('\nErrors:');
    for (const { uid, error } of errorList) {
      console.log(`  uid=${uid}: ${error}`);
    }
  }
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
