#!/usr/bin/env node
/**
 * Route parity check for a migrated TanStack Start tenant.
 *
 * Replays every URL the Next app served against a running server and asserts
 * the status, content type and cache policy. This is the acceptance criteria
 * for a migration: "all routes work the same" is only true if something
 * checks it, and checking it by hand is ~30 curls that nobody repeats.
 *
 *   # terminal 1
 *   API_URL=https://api-<tenant>.wepublish.works PORT=4202 \
 *     node dist/apps/<tenant>/.output/server/index.mjs
 *
 *   # terminal 2
 *   node tools/tanstack-route-parity.mjs                 # defaults to :4202
 *   node tools/tanstack-route-parity.mjs --base http://localhost:3000
 *   node tools/tanstack-route-parity.mjs --tag "Some Tag"
 *
 * Exits non-zero if any expectation fails, so it works as a gate.
 *
 * NOTE the `--tag` / `--article` options. A nonexistent slug 404s *before* the
 * page component renders, so a sweep of only-bogus paths proves far less than
 * it looks: it misses anything that crashes inside the real component. Pass a
 * slug that exists whenever you can.
 */
const arg = name => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

const BASE = arg('base') ?? 'http://localhost:4202';
const TAG = arg('tag');
const ARTICLE = arg('article');

const ISR = /s-maxage=\d+/;
const NO_STORE = /no-store/;

/** [path, expected status, content-type fragment, cache-control matcher] */
const ROUTES = [
  ['/', 200, 'text/html', ISR],
  ['/a', 200, 'text/html', ISR],
  ['/a?page=2', 200, 'text/html', ISR],
  ['/author', 200, 'text/html', ISR],
  ['/event', 200, 'text/html', ISR],
  ['/login', 200, 'text/html', NO_STORE],
  ['/signup', 200, 'text/html', NO_STORE],
  ['/search?q=test', 200, 'text/html', NO_STORE],
  // no-store, not ISR: the loader reads the auth cookie and dehydrates
  // Me/Invoices into the HTML. Next marked it no-store for the same reason.
  ['/mitmachen', 200, 'text/html', NO_STORE],
  ['/profile', 200, 'text/html', NO_STORE],
  ['/profile/subscription/deactivated', 200, 'text/html', NO_STORE],

  // redirects that used to live in next.config.js
  ['/abo', 307, null, null],
  ['/profile/subscription', 308, null, null],

  // feeds and sitemap, plus the legacy /api/* paths kept for subscribers
  ['/sitemap.xml', 200, 'application/xml', ISR],
  ['/rss.xml', 200, 'application/xml', ISR],
  ['/atom.xml', 200, 'application/xml', ISR],
  ['/feed.json', 200, 'application/feed+json', ISR],
  ['/api/sitemap', 301, null, null],
  ['/api/rss-feed', 301, null, null],
  ['/api/atom-feed', 301, null, null],
  ['/api/json-feed', 301, null, null],

  // the k8s probe path is a hard contract in the helm chart
  ['/api/health', 200, 'application/json', NO_STORE],
  ['/robots.txt', 200, 'text/plain', null],

  // every not-found path must be a real 404, not a 200 rendering a 404 page
  ['/this-page-does-not-exist', 404, 'text/html', null],
  ['/deep/unknown/path', 404, 'text/html', null],
  ['/a/nope-not-a-slug', 404, 'text/html', null],
  ['/author/nope', 404, 'text/html', null],
  ['/a/tag/nope', 404, 'text/html', null],
  ['/event/nope', 404, 'text/html', null],
  ['/id/nope', 404, 'text/html', null],
  ['/a/id/nope', 404, 'text/html', null],
];

// Real content exercises the page components; bogus slugs never reach them.
if (TAG) ROUTES.push([`/a/tag/${encodeURIComponent(TAG)}`, 200, 'text/html', ISR, 500]);
if (ARTICLE) ROUTES.push([`/a/${encodeURIComponent(ARTICLE)}`, 200, 'text/html', ISR, 500]);

const visibleText = html => {
  const body = html.slice(html.indexOf('<body'));
  return body
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

let failed = 0;

for (const [path, status, type, cache, minText] of ROUTES) {
  const res = await fetch(BASE + path, { redirect: 'manual' }).catch(e => e);

  if (res instanceof Error) {
    console.log(`FAIL ${path} — ${res.message}`);
    failed++;
    continue;
  }

  const problems = [];
  if (res.status !== status) problems.push(`status ${res.status} != ${status}`);

  const ct = res.headers.get('content-type') ?? '';
  if (type && !ct.includes(type)) problems.push(`content-type "${ct}" !~ ${type}`);

  const cc = res.headers.get('cache-control') ?? '';
  if (cache && !cache.test(cc)) problems.push(`cache-control "${cc}" !~ ${cache}`);

  let len = 0;
  if (minText) {
    len = visibleText(await res.text()).length;
    if (len < minText) problems.push(`only ${len} chars of text, expected >= ${minText}`);
  }

  if (problems.length) {
    failed++;
    console.log(`FAIL ${path}\n       ${problems.join('\n       ')}`);
  } else {
    console.log(`ok   ${path.padEnd(38)} ${res.status}${minText ? `  text=${len}` : ''}`);
  }
}

console.log(`\n${ROUTES.length - failed}/${ROUTES.length} routes as expected`);
process.exit(failed ? 1 : 0);
