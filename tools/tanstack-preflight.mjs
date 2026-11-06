#!/usr/bin/env node
/**
 * Pre-flight for replaying the TanStack Start migration.
 *
 * The playbook in `.claude/docs/tanstack-start-migration.md` rests on facts
 * about master that keep changing: package versions, peer ranges, where the
 * Next coupling lives, which CI flags reach the build. Every replay so far has
 * been slowed down by one of them having moved silently.
 *
 * This script checks those assumptions and prints what drifted, so the replay
 * starts from "here are the four things that changed" instead of discovering
 * them one failed build at a time.
 *
 *   node tools/tanstack-preflight.mjs
 *
 * Exit code is 0 even when checks fail — drift is expected and informational.
 * Pass --strict to exit 1 instead, for CI.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const results = [];

const record = (status, name, detail) => results.push({ status, name, detail });
const ok = (name, detail) => record('ok', name, detail);
const drift = (name, detail) => record('drift', name, detail);

const sh = cmd => {
  try {
    return execFileSync('sh', ['-c', cmd], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const json = path => JSON.parse(readFileSync(path, 'utf8'));

const pkg = json('package.json');
const dep = name => pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];

// ---------------------------------------------------------------- versions

const npmView = (spec, field) => sh(`npm view ${spec} ${field} 2>/dev/null`);

const vite = dep('vite');
const start = dep('@tanstack/react-start');
const nitro = dep('nitro');

if (!start) {
  drift('tanstack installed', 'not a dependency yet — this is a fresh replay');
} else {
  const peer = npmView(`@tanstack/react-start@${start.replace(/^[\^~]/, '')}`, 'peerDependencies.vite');
  const viteMajor = (vite ?? '').replace(/^[\^~]/, '').split('.')[0];
  const wantsMajor = (peer.match(/>=\s*(\d+)/) ?? [])[1];

  if (wantsMajor && viteMajor && Number(viteMajor) >= Number(wantsMajor)) {
    ok('vite satisfies @tanstack/react-start', `vite ${vite} vs peer ${peer}`);
  } else {
    drift(
      'vite vs @tanstack/react-start peer',
      `vite ${vite}, react-start ${start} wants ${peer}. Either bump vite or pin react-start to the last release for this vite major.`
    );
  }

  const nitroPeer = npmView(`nitro@${(nitro ?? '').replace(/^[\^~]/, '')}`, 'peerDependencies.vite');
  if (nitro?.includes('beta')) {
    ok('nitro', `${nitro} (beta — the only 'latest' tag; stable 3.0.0 peers vite ^7)`);
  } else if (nitroPeer && viteMajor && !nitroPeer.includes(viteMajor)) {
    drift('nitro vs vite', `nitro ${nitro} peers vite ${nitroPeer} but vite is ${vite}`);
  } else {
    ok('nitro', `${nitro}`);
  }

  const latestStart = npmView('@tanstack/react-start', 'version');
  if (latestStart && !start.includes(latestStart)) {
    record('info', '@tanstack/react-start is behind latest', `installed ${start}, latest ${latestStart}`);
  }
}

// ------------------------------------------------------------ barrel split

const CORE = 'libs/utils/website/src/index.ts';
const NEXT = 'libs/utils/website/src/next.ts';

if (!existsSync(NEXT)) {
  drift('barrel split', `${NEXT} missing — PR1 (the core/next split) has not landed on this base`);
} else {
  const leaked = sh(
    `grep -l "from 'next" $(sed -n "s#^export \\* from '\\./#libs/utils/website/src/#p" ${CORE} | sed "s#';#.ts#") 2>/dev/null; ` +
    `grep -l "from 'next" $(sed -n "s#^export \\* from '\\./#libs/utils/website/src/#p" ${CORE} | sed "s#';#.tsx#") 2>/dev/null`
  );
  if (leaked) {
    drift('core barrel purity', `these files are re-exported from the core barrel but import next/*:\n    ${leaked.split('\n').join('\n    ')}`);
  } else {
    ok('core barrel purity', 'no next/* reachable from the package root');
  }

  const stale = sh(`node tools/split-utils-website-imports.mjs --dry-run 2>/dev/null | tail -1`);
  if (stale.includes('would change 0')) {
    ok('import codemod', 'no call sites left to rewrite');
  } else {
    drift('import codemod', `${stale.trim()} — run: node tools/split-utils-website-imports.mjs`);
  }
}

// ------------------------------------------------- next coupling elsewhere

// Only *value* imports matter. `import {NextApiRequest} from 'next'` is erased
// at compile time, and specs are never bundled — flagging either trains people
// to ignore this check.
const nextInLibs = sh(
  `git grep -l "from 'next" -- 'libs/**/*.ts' 'libs/**/*.tsx' ` +
    `| grep -v 'libs/utils/website/src/next' ` +
    `| grep -v storybook ` +
    `| grep -vE '\\.spec\\.|\\.test\\.' ` +
    `| while read -r f; do ` +
    `grep -qE "^import type .*from 'next|^import \\{ *[A-Z][A-Za-z]*(Request|Response|Context|Props|Page)[^}]*\\} from 'next'" "$f" || echo "$f"; ` +
    `done`
);
if (nextInLibs) {
  drift(
    'next imports outside the next barrel',
    `a non-Next app cannot bundle these:\n    ${nextInLibs.split('\n').join('\n    ')}`
  );
} else {
  ok('next imports in libs', 'confined to libs/utils/website/src/next');
}

// ------------------------------------------------------------- deployment

const dockerfile = existsSync('Dockerfile') ? readFileSync('Dockerfile', 'utf8') : '';
if (dockerfile.includes('AS website-tanstack')) {
  ok('Dockerfile', 'website-tanstack stages present');
} else {
  drift('Dockerfile', 'no website-tanstack stage — the TanStack app has nowhere to build');
}

const wf = '.github/workflows/on-demand-publish-docker-image-website.yml';
if (existsSync(wf)) {
  const s = readFileSync(wf, 'utf8');
  if (s.includes('WEBSITE_TARGET')) {
    ok('publish workflow', 'selects the docker target by vite config');
  } else {
    drift('publish workflow', `${wf} still hardcodes \`target: website\``);
  }
  if (/experimental-build-mode/.test(s)) {
    record('info', 'NX_NEXT_PROJECT_BUILD_OPTIONS', 'still injects Next-only flags; the tanstack stage must not forward it');
  }
}

// ------------------------------------------------- cjs require("react")
//
// See pitfall 6.16. A tree with these hoisted to the root resolves them to
// their ESM builds and never reproduces the bug CI hits, so the warning
// matters more than the alias check: it says "your build is not CI's".

const CJS_REACT_CONSUMERS = ['react-transition-group', 'use-sync-external-store'];
const hoisted = CJS_REACT_CONSUMERS.filter(name =>
  existsSync(`node_modules/${name}`)
);

if (hoisted.length) {
  record(
    'info',
    'root-hoisted CJS React consumers',
    `${hoisted.join(', ')} resolve from the root node_modules here, so a local build cannot reproduce the __require("react") CI produces. Verify in a clean tree — see pitfall 6.16.`
  );
}

if (existsSync('docker/check-nitro-output.js')) {
  ok('unresolvable-require guard', 'docker/check-nitro-output.js present');
} else {
  drift(
    'unresolvable-require guard',
    'docker/check-nitro-output.js missing — nothing stops a bundle that require()s a package .output does not ship'
  );
}

const helm = 'helm/charts/wepublish-website/templates/website.yaml';
if (existsSync(helm)) {
  const probePath = (readFileSync(helm, 'utf8').match(/path:\s*(\S+)/) ?? [])[1];
  if (probePath === '/api/health') {
    ok('helm probe contract', '/api/health — the TanStack app must keep serving this path');
  } else {
    drift('helm probe contract', `probes ${probePath}, not /api/health — update the route`);
  }
}

// --------------------------------------------------------------- vi.mock

const risky = sh(
  `git grep -l "vi.mock('\\./.*\\.model'" -- 'libs/**/*.spec.ts' | head -20`
);
if (risky) {
  record(
    'info',
    'partial vi.mock of NestJS model modules',
    `emitDecoratorMetadata makes decorated parameter types runtime references; vite 8 evaluates them where vite 7 elided them, so these factories must list every class the service imports:\n    ${risky.split('\n').join('\n    ')}`
  );
}

// ----------------------------------------------------------------- output

const icon = { ok: '  ok  ', drift: ' DRIFT', info: ' note ' };
for (const r of results) {
  console.log(`[${icon[r.status]}] ${r.name}\n          ${r.detail.replace(/\n/g, '\n          ')}`);
}

const drifted = results.filter(r => r.status === 'drift');
console.log(
  `\n${drifted.length} assumption(s) drifted, ${results.filter(r => r.status === 'ok').length} held.`
);

if (drifted.length && strict) {
  process.exit(1);
}
