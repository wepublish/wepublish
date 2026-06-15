#!/usr/bin/env node
// Build a static HTML dashboard showing the current production deployment of
// every app, sourced from the "deploy production" GitHub Actions workflow.
//
// Production deploys are triggered by git tags of the form
// `deploy_<project>_<YYYYMMDDHHMM>`, which run the workflow defined in
// WORKFLOW_FILE. Each workflow run carries the project (via the tag in
// head_branch), the commit, the actor, the timestamp and the run status, so
// the workflow-runs API is the source of truth — not the (long-abandoned)
// GitHub Deployments API.
//
// Environment variables:
//   GITHUB_TOKEN      Token with `actions: read` / `repo` scope (provided
//                     automatically in GitHub Actions).
//   GITHUB_REPOSITORY "<owner>/<repo>" (set by Actions). Falls back to
//                     "wepublish/wepublish" for local runs.
//   WORKFLOW_FILE     Optional. Workflow file name. Defaults to
//                     "on-tag-deploy-production.yml".
//   TAG_PREFIX        Optional. Deploy-tag prefix. Defaults to "deploy_".
//
// Output: dist/index.html

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY ?? 'wepublish/wepublish';
const [OWNER, REPO_NAME] = REPO.split('/');
const WORKFLOW_FILE = process.env.WORKFLOW_FILE ?? 'on-tag-deploy-production.yml';
const TAG_PREFIX = process.env.TAG_PREFIX ?? 'deploy_';
// Optional override for the currently-published dashboard URL, used to read
// back the persisted branch store. Falls back to the repo's GitHub Pages URL.
const DASHBOARD_URL = process.env.DASHBOARD_URL;
// <script> id under which the tag→branch store is embedded in the page.
const STORE_ID = 'deploy-branch-store';

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

// Parse `deploy_<project>_<YYYYMMDDHHMM>` → { project, stamp }. Project names
// may contain hyphens (e.g. "next-bajour"), so only the trailing 12-digit
// timestamp is split off. Returns null for tags that don't match.
const parseTag = tag => {
  if (!tag || !tag.startsWith(TAG_PREFIX)) {
    return null;
  }
  const rest = tag.slice(TAG_PREFIX.length);
  const m = rest.match(/^(.+)_(\d{12})$/);
  if (!m) {
    return null;
  }
  return { project: m[1], stamp: m[2] };
};

// Fetch production workflow runs (newest first) and keep the latest run per
// project. The first run seen for a project is the newest, since the API
// returns runs in descending creation order.
const listLatestRunsByProject = async () => {
  const perPage = 100;
  const maxPages = 6;
  const latest = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const data = await api(
      `/repos/${OWNER}/${REPO_NAME}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/runs?per_page=${perPage}&page=${page}`
    );
    const runs = data.workflow_runs ?? [];
    for (const run of runs) {
      const parsed = parseTag(run.head_branch);
      if (!parsed) {
        continue;
      }
      if (!latest.has(parsed.project)) {
        latest.set(parsed.project, { ...parsed, run });
      }
    }
    if (runs.length < perPage) {
      break;
    }
  }
  return [...latest.values()];
};

// Recover the branch a deploy was cut from. A git tag points to a commit, not
// a branch, so this is only knowable when the deployed commit is still the
// head of some branch — typically feature/hotfix deploys. Mainline deploys
// (commit already buried under later commits on the production branch) return
// null, since the source branch can't be attributed reliably.
const getBranchForCommit = async sha => {
  try {
    const branches = await api(
      `/repos/${OWNER}/${REPO_NAME}/commits/${sha}/branches-where-head`
    );
    return branches.length ? branches[0].name : null;
  } catch {
    return null;
  }
};

// The published dashboard is its own store: each page embeds a tag→branch map
// as a JSON island. Reading it back lets a deploy keep its branch label even
// after work continues on that branch (the commit is no longer the branch
// head), since the tag is immutable until the next deploy.
const resolvePublishedUrl = async () => {
  if (DASHBOARD_URL) {
    return DASHBOARD_URL;
  }
  try {
    const pages = await api(`/repos/${OWNER}/${REPO_NAME}/pages`);
    return pages.html_url ?? null;
  } catch {
    return null;
  }
};

const loadBranchStore = async () => {
  const url = await resolvePublishedUrl();
  if (!url) {
    return new Map();
  }
  try {
    // Cache-buster: GitHub Pages sits behind a CDN, and a stale copy could
    // miss a just-captured branch and trigger a needless re-resolve.
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      return new Map();
    }
    const html = await res.text();
    const m = html.match(
      new RegExp(`<script id="${STORE_ID}" type="application/json">([\\s\\S]*?)</script>`)
    );
    if (!m) {
      return new Map();
    }
    const obj = JSON.parse(m[1]);
    return new Map(Object.entries(obj));
  } catch (err) {
    console.warn(`Could not load branch store: ${err.message}`);
    return new Map();
  }
};

// Embed the store as an HTML-safe JSON island. Escaping "<" prevents a branch
// name containing "</script>" from breaking out of the script element.
const renderBranchStore = store => {
  const obj = Object.fromEntries(store);
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `    <script id="${STORE_ID}" type="application/json">${json}</script>`;
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

// Map a workflow run's status/conclusion to a display state.
const runState = run => {
  if (run.status !== 'completed') {
    return 'pending';
  }
  if (run.conclusion === 'success') {
    return 'success';
  }
  if (run.conclusion === 'failure' || run.conclusion === 'timed_out') {
    return 'failure';
  }
  if (run.conclusion === 'cancelled') {
    return 'cancelled';
  }
  return 'pending';
};

const renderCard = ({ project, run, branch }) => {
  const sha = (run.head_sha ?? '').slice(0, 7);
  const msg = (run.display_title || run.head_commit?.message || '').split('\n')[0];
  const actor = run.actor?.login ?? run.triggering_actor?.login ?? '—';
  const time = run.created_at;
  const state = runState(run);
  const stateClass =
    state === 'success' ? 'ok'
    : state === 'failure' ? 'fail'
    : state === 'cancelled' ? 'fail'
    : 'pending';
  const stateMark =
    state === 'success' ? '✓'
    : state === 'failure' ? '✕'
    : state === 'cancelled' ? '⊘'
    : '…';
  const commitUrl = `https://github.com/${OWNER}/${REPO_NAME}/commit/${run.head_sha}`;
  const runUrl = run.html_url;
  const branchUrl = `https://github.com/${OWNER}/${REPO_NAME}/tree/${encodeURIComponent(branch ?? '')}`;
  const branchLine = branch
    ? `\n        <a class="branch" href="${branchUrl}" title="branch this deploy was cut from">⎇ ${escapeHtml(branch)}</a>`
    : '';
  return `      <article class="card ${stateClass}">
        <header>
          <h2>${escapeHtml(project)}</h2>
          <span class="state" aria-label="${escapeHtml(state)}">${stateMark}</span>
        </header>
        <a class="ref" href="${escapeHtml(runUrl)}">${escapeHtml(run.head_branch)}</a>${branchLine}
        <a class="sha" href="${commitUrl}"><code>${escapeHtml(sha)}</code></a>
        <div class="msg">${escapeHtml(msg)}</div>
        <footer>
          <time datetime="${escapeHtml(time)}">${escapeHtml(ago(time))}</time>
          <span class="by">· ${escapeHtml(actor)}</span>
        </footer>
      </article>`;
};

const renderEmpty = () => `      <p class="empty">No production deployments found. Tag a release (deploy_&lt;project&gt;_…) to populate this dashboard.</p>`;

const renderPage = (cards, store) => `<!doctype html>
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
      .ref { font-size: 0.85rem; opacity: 0.8; text-decoration: none; }
      .branch { font-size: 0.8rem; opacity: 0.7; text-decoration: none; font-family: ui-monospace, monospace; }
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
    <p class="meta">Last refreshed <time datetime="${new Date().toISOString()}">${new Date().toUTCString()}</time> · <a href="https://github.com/${OWNER}/${REPO_NAME}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}">All production deploys on GitHub</a></p>
${renderBranchStore(store)}
  </body>
</html>
`;

const main = async () => {
  const entries = await listLatestRunsByProject();
  console.log(`Found ${entries.length} project(s) with production deploys`);
  // Most recently deployed first.
  entries.sort((a, b) => new Date(b.run.created_at) - new Date(a.run.created_at));
  // The source branch is only resolvable while the deploy commit is still a
  // branch head. Capture it once per deploy tag and persist it, so the label
  // survives later work on that branch and only changes on the next deploy.
  const prev = await loadBranchStore();
  const store = new Map();
  await Promise.all(
    entries.map(async entry => {
      const tag = entry.run.head_branch;
      if (prev.has(tag)) {
        entry.branch = prev.get(tag);
      } else {
        entry.branch = await getBranchForCommit(entry.run.head_sha);
      }
      // Rebuild the store from current tags only, so it never grows unbounded.
      store.set(tag, entry.branch ?? null);
    })
  );
  const cards = entries.map(renderCard);
  mkdirSync('dist', { recursive: true });
  writeFileSync(resolve('dist', 'index.html'), renderPage(cards, store));
  const carried = entries.filter(e => prev.has(e.run.head_branch)).length;
  console.log(
    `Wrote dist/index.html with ${cards.length} card(s); ${carried} branch(es) carried from store, ${cards.length - carried} freshly resolved`
  );
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
