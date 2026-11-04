#!/usr/bin/env node
/**
 * Shell parity check for a migrated TanStack Start tenant.
 *
 * `tanstack-route-parity.mjs` proves every URL still answers. It cannot see
 * what a page *renders*, and that is where this migration kept losing things:
 * a prop on `TenantProviders`, a context provider that only the home page
 * mounted, a `fullWidth` that flipped. Every one of those shipped green.
 *
 * So this compares the two sources directly — `pages/_app.tsx` against
 * `src/app.tsx`, and `pages/index.tsx` against `src/routes/index.tsx` — and
 * reports anything the Next file mentions that the TanStack file does not.
 *
 *   node tools/tanstack-shell-parity.mjs <tenant> [--base <git-ref>]
 *
 * `--base` is the ref holding the Next app (default: the commit before
 * gruppetto's migration). Exits non-zero when something is missing, so it
 * works as a gate.
 *
 * It is deliberately dumb: substring presence, no parsing. False positives
 * are cheap to dismiss, a silent miss is what cost us production twice.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DEFAULT_BASE = 'c14deea9c87e77b04a7edd633991f0fff57de029^';

/**
 * Things worth noticing. The analytics scripts moved wholesale into the shared
 * `<Analytics>` component, so they are only reported when that is absent too.
 */
const MARKERS = [
  { name: 'settingsTheme', pattern: /settingsTheme/ },
  { name: 'thirdParty (stripe key)', pattern: /thirdParty/ },
  { name: 'DailyBriefingContext', pattern: /DailyBriefingContext/ },
  { name: 'LinkContext', pattern: /LinkContext/ },
  { name: 'ContentWidthProvider', pattern: /<ContentWidthProvider[^>]*>/ },
  { name: 'styled(PageContainer)', pattern: /styled\(PageContainer\)/ },
  { name: 'ContentWrapper', pattern: /ContentWrapper/ },
  { name: 'AdConfig', pattern: /AdConfig/ },
  { name: 'ReviveScript', pattern: /ReviveScript/ },
  { name: 'AdblockOverlay', pattern: /AdblockOverlay/ },
  { name: 'PURModel', pattern: /PURModel/ },
  { name: 'OneSignal', pattern: /OneSignal/ },
  { name: 'GPT tag', pattern: /securepubads/ },
  { name: 'categorySlugs', pattern: /categorySlugs=\{[^}]*\}/ },
  { name: 'Plausible', pattern: /Plausible/, sharedWithAnalytics: true },
  { name: 'GoogleAnalytics', pattern: /GoogleAnalytics/, sharedWithAnalytics: true },
  { name: 'GoogleTagManager', pattern: /GoogleTagManager/, sharedWithAnalytics: true },
  { name: 'piwik', pattern: /piwik/, sharedWithAnalytics: true },
  { name: 'sparkLoop', pattern: /sparkLoop/, sharedWithAnalytics: true },
];

const arg = name => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

const tenant = process.argv[2];

if (!tenant || tenant.startsWith('--')) {
  console.error('Usage: node tools/tanstack-shell-parity.mjs <tenant> [--base <ref>]');
  process.exit(2);
}

const base = arg('base') ?? DEFAULT_BASE;

const fromGit = path => {
  try {
    return execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' });
  } catch {
    return undefined;
  }
};

const fromDisk = path => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
};

const PAIRS = [
  {
    label: 'app shell',
    old: `apps/${tenant}/pages/_app.tsx`,
    now: `apps/${tenant}/src/app.tsx`,
  },
  {
    label: 'home page',
    old: `apps/${tenant}/pages/index.tsx`,
    now: `apps/${tenant}/src/routes/index.tsx`,
  },
];

let failed = false;

for (const { label, old: oldPath, now: nowPath } of PAIRS) {
  const before = fromGit(oldPath);
  const after = fromDisk(nowPath);

  if (!before) {
    console.log(`· ${label}: no ${oldPath} at ${base}, skipped`);
    continue;
  }

  if (!after) {
    console.log(`✗ ${label}: ${nowPath} is missing`);
    failed = true;
    continue;
  }

  const hasAnalytics = /<Analytics/.test(after);
  const missing = [];
  const changed = [];

  for (const { name, pattern, sharedWithAnalytics } of MARKERS) {
    const wanted = before.match(pattern);

    if (!wanted) {
      continue;
    }

    if (sharedWithAnalytics && hasAnalytics) {
      continue;
    }

    const got = after.match(pattern);

    if (!got) {
      missing.push(name);
    } else if (wanted[0] !== got[0]) {
      changed.push(`${name}: ${wanted[0]} -> ${got[0]}`);
    }
  }

  if (!missing.length && !changed.length) {
    console.log(`✓ ${label}`);
    continue;
  }

  failed = true;
  for (const name of missing) console.log(`✗ ${label}: lost ${name}`);
  for (const line of changed) console.log(`✗ ${label}: ${line}`);
}

process.exit(failed ? 1 : 0);
