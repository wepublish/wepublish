#!/usr/bin/env node
/**
 * Moves the Next-only half of `libs/utils/website` from `src/lib/` into
 * `src/next/`, mirroring `src/tanstack/`.
 *
 * Idempotent: re-running after a merge conflict is safe, it skips whatever is
 * already in place.
 *
 *   node tools/move-next-into-subfolder.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const SRC = 'libs/utils/website/src';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const tracked = pattern => git('ls-files', pattern).split('\n').filter(Boolean);

const MOVING = [
  'lib/auth-guard.tsx',
  'lib/fetch-404.ts',
  'lib/get-session-token-props.tsx',
  'lib/handle-jwt-login.ts',
  'lib/next-wepublish-link.tsx',
  'lib/next.config.js',
  'lib/routed-admin-bar.tsx',
  'lib/with-builder-router.tsx',
  // Only the two `@sentry/nextjs` entry points. `sentry/error-no-store` is
  // framework-neutral and the TanStack instrumentation imports it, so it
  // stays in `lib/`.
  'lib/sentry/instrumentation.ts',
  'lib/sentry/instrumentation.client.ts',
  ...tracked(`${SRC}/lib/pages`).map(p => p.replace(`${SRC}/`, '')),
];

const moved = new Set(MOVING.map(p => p.replace(/^lib\//, 'next/')));
const newPathOf = rel => rel.replace(/^lib\//, 'next/');

let moves = 0;
for (const rel of MOVING) {
  const from = join(SRC, rel);
  const to = join(SRC, newPathOf(rel));

  if (!existsSync(from)) {
    continue;
  }

  mkdirSync(dirname(to), { recursive: true });
  git('mv', from, to);
  moves++;
}

const resolveSpec = (fromRel, spec) => {
  const base = resolve(SRC, dirname(fromRel), spec);

  for (const ext of ['', '.ts', '.tsx', '.js']) {
    if (existsSync(base + ext)) {
      return relative(resolve(SRC), base + ext);
    }
  }

  return null;
};

const specFor = (fromRel, targetRel) => {
  const spec = relative(dirname(fromRel), targetRel).replace(/\.(tsx?|js)$/, '');

  return spec.startsWith('.') ? spec : `./${spec}`;
};

// A moved file's relative import of something still in `lib/` now needs to
// climb back out. Recomputed rather than string-patched, so nesting depth
// cannot be got wrong.
let rewrites = 0;
for (const rel of [...moved]) {
  const file = join(SRC, rel);

  if (!existsSync(file)) {
    continue;
  }

  const before = readFileSync(file, 'utf8');
  const after = before.replace(
    /(from '|require\('|import ')(\.[^']*)'/g,
    (match, prefix, spec) => {
      const target = resolveSpec(rel, spec);

      if (target || !spec.startsWith('.')) {
        return match;
      }

      const asLib = resolveSpec(rel.replace(/^next\//, 'lib/'), spec);

      return asLib ? `${prefix}${specFor(rel, asLib)}'` : match;
    }
  );

  if (after !== before) {
    writeFileSync(file, after);
    rewrites++;
  }
}

const patch = (path, replacements) => {
  if (!existsSync(path)) {
    return 0;
  }

  const before = readFileSync(path, 'utf8');
  const after = replacements.reduce(
    (text, [from, to]) => text.split(from).join(to),
    before
  );

  if (after === before) {
    return 0;
  }

  writeFileSync(path, after);

  return 1;
};

let barrel = patch(
  `${SRC}/next.ts`,
  [...moved].map(rel => [
    `'./${rel.replace(/^next\//, 'lib/').replace(/\.(tsx?|js)$/, '')}'`,
    `'./${rel.replace(/\.(tsx?|js)$/, '')}'`,
  ])
);

let configs = 0;
for (const file of tracked('apps/*/next.config.js')) {
  configs += patch(file, [
    ['libs/utils/website/src/lib/next.config', 'libs/utils/website/src/next/next.config'],
  ]);
}

// `next.config.js` resolves the ISR cache handler from `__dirname`, which the
// move repoints at `next/`. `page-cache/` stays in the core, so the handler
// has to be reached through `../lib/`. The sibling `../../../../../` walks to
// the workspace root are unaffected: `lib/` and `next/` sit at the same depth.
const cacheHandler = patch(`${SRC}/next/next.config.js`, [
  [
    "join(__dirname, 'page-cache', 'page-cache-handler.js')",
    "join(\n    __dirname,\n    '..',\n    'lib',\n    'page-cache',\n    'page-cache-handler.js'\n  )",
  ],
]);

let aliases = 0;
for (const file of [...tracked('apps'), ...tracked('libs'), 'tsconfig.base.json']) {
  if (!/\.(ts|tsx|js|mjs|json)$/.test(file)) {
    continue;
  }

  aliases += patch(file, [
    ['@wepublish/utils/website/sentry/client', '@wepublish/utils/website/next/sentry/client'],
    ['@wepublish/utils/website/sentry', '@wepublish/utils/website/next/sentry'],
    ['libs/utils/website/src/lib/sentry/', 'libs/utils/website/src/next/sentry/'],
    [
      'libs/utils/website/src/lib/next-wepublish-link',
      'libs/utils/website/src/next/next-wepublish-link',
    ],
  ]);
}

console.log(
  `moved ${moves} file(s), rewrote ${rewrites} import(s), ${barrel} barrel, ${configs} next.config(s), ${cacheHandler} cache handler, ${aliases} alias site(s)`
);
