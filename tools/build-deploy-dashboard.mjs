#!/usr/bin/env node
// Build a static HTML dashboard showing the current production deployment of
// every app, sourced from the GitHub Deployments API.
//
// Environment variables:
//   GITHUB_TOKEN      Token with `deployments: read` (provided automatically in
//                     GitHub Actions).
//   GITHUB_REPOSITORY "<owner>/<repo>" (set by Actions). Falls back to
//                     "wepublish/wepublish" for local runs.
//   ENV_PREFIX        Optional. Environment-name prefix used to filter which
//                     environments are shown. Defaults to "production-".
//
// Output: dist/index.html

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? 'wepublish/wepublish';
const [OWNER, REPO_NAME] = REPO.split('/');
const ENV_PREFIX = process.env.ENV_PREFIX ?? 'production-';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

const api = async path => {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const listEnvironments = async () => {
  const data = await api(
    `/repos/${OWNER}/${REPO_NAME}/environments?per_page=100`
  );
  return (data.environments ?? [])
    .map(e => e.name)
    .filter(name => name.startsWith(ENV_PREFIX));
};

const getLatestDeployment = async env => {
  const list = await api(
    `/repos/${OWNER}/${REPO_NAME}/deployments?environment=${encodeURIComponent(env)}&per_page=1`
  );
  if (!list.length) {
    return null;
  }
  const deployment = list[0];
  const [statuses, commit] = await Promise.all([
    api(deployment.statuses_url),
    api(`/repos/${OWNER}/${REPO_NAME}/commits/${deployment.sha}`),
  ]);
  return { deployment, status: statuses[0] ?? null, commit };
};

const ago = iso => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) {
    return 'just now';
  }
  if (min < 60) {
    return `${min}m ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr}h ago`;
  }
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

const escapeHtml = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderCard = ({ env, deployment, status, commit }) => {
  const project = env.slice(ENV_PREFIX.length);
  const sha = deployment.sha.slice(0, 7);
  const ref = deployment.ref;
  const msg = (commit.commit.message || '').split('\n')[0];
  const actor = deployment.creator?.login ?? '—';
  const time = status?.created_at ?? deployment.created_at;
  const state = status?.state ?? 'pending';
  const stateClass =
    state === 'success' ? 'ok'
    : state === 'failure' || state === 'error' ? 'fail'
    : 'pending';
  const stateMark =
    state === 'success' ? '✓'
    : state === 'failure' || state === 'error' ? '✕'
    : '…';
  const commitUrl = `https://github.com/${OWNER}/${REPO_NAME}/commit/${deployment.sha}`;
  return `      <article class="card ${stateClass}">
        <header>
          <h2>${escapeHtml(project)}</h2>
          <span class="state" aria-label="${escapeHtml(state)}">${stateMark}</span>
        </header>
        <div class="ref">${escapeHtml(ref)}</div>
        <a class="sha" href="${commitUrl}"><code>${escapeHtml(sha)}</code></a>
        <div class="msg">${escapeHtml(msg)}</div>
        <footer>
          <time datetime="${escapeHtml(time)}">${escapeHtml(ago(time))}</time>
          <span class="by">· ${escapeHtml(actor)}</span>
        </footer>
      </article>`;
};

const renderEmpty = () => `      <p class="empty">No production deployments recorded yet. Tag a release to populate this dashboard.</p>`;

const renderPage = cards => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>wepublish · deployments</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color-scheme: light dark; }
      body { margin: 0; padding: 1.5rem; background: Canvas; color: CanvasText; }
      h1 { font-size: 1.25rem; margin: 0 0 1.5rem; }
      .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
      .card { border: 1px solid color-mix(in oklab, CanvasText 18%, transparent); border-radius: 8px; padding: 1rem; display: grid; gap: 0.35rem; background: color-mix(in oklab, Canvas 97%, CanvasText 3%); }
      .card header { display: flex; align-items: baseline; justify-content: space-between; }
      .card h2 { font-size: 1rem; margin: 0; font-weight: 600; }
      .state { font-size: 1.05rem; line-height: 1; }
      .ok .state { color: #16a34a; }
      .fail .state { color: #dc2626; }
      .pending .state { color: #d97706; }
      .ref { font-size: 0.85rem; opacity: 0.8; }
      .sha { font-family: ui-monospace, monospace; font-size: 0.85rem; text-decoration: none; opacity: 0.9; }
      .sha code { background: color-mix(in oklab, Canvas 86%, CanvasText 14%); padding: 0.05rem 0.4rem; border-radius: 4px; }
      .msg { font-size: 0.9rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; opacity: 0.9; }
      .card footer { display: flex; gap: 0.35rem; font-size: 0.8rem; opacity: 0.75; margin-top: 0.25rem; }
      .empty { opacity: 0.75; font-size: 0.95rem; }
      .meta { color: color-mix(in oklab, CanvasText 55%, transparent); font-size: 0.8rem; margin-top: 1.5rem; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <h1>wepublish · production deployments</h1>
    <section class="grid">
${cards.length ? cards.join('\n') : renderEmpty()}
    </section>
    <p class="meta">Last refreshed <time datetime="${new Date().toISOString()}">${new Date().toUTCString()}</time> · <a href="https://github.com/${OWNER}/${REPO_NAME}/deployments">All deployments on GitHub</a></p>
  </body>
</html>
`;

const main = async () => {
  const envs = (await listEnvironments()).sort();
  console.log(`Found ${envs.length} environments matching prefix "${ENV_PREFIX}"`);
  const entries = [];
  for (const env of envs) {
    try {
      const data = await getLatestDeployment(env);
      if (data) {
        entries.push({ env, ...data });
      }
    } catch (err) {
      console.warn(`Skipping ${env}: ${err.message}`);
    }
  }
  const cards = entries.map(renderCard);
  mkdirSync('dist', { recursive: true });
  writeFileSync(resolve('dist', 'index.html'), renderPage(cards));
  console.log(`Wrote dist/index.html with ${cards.length} card(s)`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
