/// <reference types="vitest" />
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// `.mts` so Vite loads this config as ESM: `@tanstack/react-start/plugin/vite`
// is ESM-only and a plain `vite.config.ts` in a CommonJS package is `require`d.
// ESM has no `__dirname`.
const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(projectRoot, '../..');
const projectName = basename(projectRoot);

// Keep the repo convention: build artefacts live under `dist/apps/<app>`, not
// inside the project directory. The Dockerfile and `project.json#outputs`
// both rely on this path.
const outputDir = join(workspaceRoot, 'dist/apps', projectName, '.output');

/**
 * Environment variables the browser needs.
 *
 * Next's `next.config.js#env` inlined these at **build time**, which means one
 * image per environment. We do it at runtime instead: the server reads its
 * real `process.env`, the root shell serialises the result into
 * `window.PUBLIC_ENV`, and every `process.env.X` in client code is rewritten
 * to read from that object (see `clientDefine` below).
 *
 * So one build artefact serves dev, review, staging and production.
 *
 * `NODE_ENV` is deliberately absent: Vite and React rely on it being a literal
 * that dead-code elimination can act on.
 */
const RUNTIME_ENV = [
  'API_URL',
  'APP_ENVIRONMENT',
  'APP_NAME',
  'APP_RELEASE_ID',
  'SSR_FETCH_TIMEOUT_MS',
  'SENTRY_DSN',
] as const;

export default defineConfig(({ mode }) => {
  // `loadEnv(mode, dir, '')` with an empty prefix reads *every* key, not just
  // VITE_*. Nx's Next executor used to load `.env.local` into `process.env`
  // for us; nothing does that for Vite, so we do it by hand. Without this the
  // dev server SSR has no API_URL and every query fails with a relative URL.
  const env = loadEnv(mode, projectRoot, '');
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }

  // `define` is a raw text substitution, so the replacement can point at a
  // *global* instead of being a literal — that is what turns a compile-time
  // constant into a runtime lookup.
  //
  // esbuild only accepts a JS literal or a dotted entity name here; an
  // expression like `(globalThis.X?.Y ?? '')` is rejected with
  // "Invalid define value". Hence the plain global, which the root shell
  // always defines in an inline `<head>` script — that runs before the
  // deferred module bundle, so it is never undefined by the time this reads
  // it.
  const clientDefine = Object.fromEntries(
    RUNTIME_ENV.map(key => [
      `process.env.${key}`,
      `globalThis.PUBLIC_ENV.${key}`,
    ])
  );

  return {
    root: projectRoot,
    cacheDir: join(workspaceRoot, 'node_modules/.vite/gruppetto'),

    server: {
      port: 4202,
      // The workspace root has to be allowed, otherwise Vite refuses to serve
      // the `libs/**` sources that the tsconfig path mappings point at.
      fs: { allow: [workspaceRoot] },
    },
    preview: { port: 4202 },

    // Client only. The server keeps its real `process.env` — never `define`
    // anything there, or runtime configuration silently stops working.
    //
    // And never `define: { 'process.env': ... }` wholesale: that breaks every
    // `process.env.FOO` read inside node_modules.
    environments: {
      client: { define: clientDefine },
    },

    resolve: {
      // MUI's styled engine and our own `@emotion/styled` must resolve to the
      // same emotion instance, otherwise the theme context is empty during SSR
      // (`theme.breakpoints` undefined). This is the Vite equivalent of the
      // `transpilePackages` workaround in `libs/utils/website/.../next.config`.
      dedupe: [
        'react',
        'react-dom',
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        '@mui/material',
        '@mui/styled-engine',
        '@apollo/client',
        'i18next',
        'react-i18next',
      ],
    },

    ssr: {
      // Vite inlines `noExternal` dependencies without CommonJS interop, so a
      // package whose exports map resolves to `*.cjs.js` dies with
      // "exports is not defined". Emotion's map offers `module` (ESM) before
      // `default` (CJS) — spelling the conditions out makes sure the ESM
      // branch is the one that wins.
      resolve: {
        conditions: ['module', 'node', 'development|production'],
        externalConditions: ['node'],
      },
      // ESM-only / JSX-shipping packages that must be transformed instead of
      // being `require`d by the Node SSR runtime.
      // `lodash` is CJS; `import { escape } from 'lodash'`
      // (libs/feed/website/src/lib/sitemap-generator.ts) throws
      // "Named export 'escape' not found" in Vite's dev SSR module runner
      // unless the package is transformed instead of externalised. The
      // production build happened to work, so this only bites `vite dev`.
      noExternal: [
        'react-tweet',
        '@mui/x-date-pickers',
        'lodash',
        // Emotion and MUI must go through ONE compilation pipeline. Left
        // externalised, Vite's dev SSR runner loads the CJS build of
        // `@emotion/react` for MUI's styled engine and the ESM build for our
        // own `@emotion/styled`: two ThemeContexts, and every styled component
        // server-renders with an empty theme ("theme.spacing is not a
        // function"). This is the `transpilePackages` entry from
        // `libs/utils/website/src/lib/next.config.js`, restated for Vite.
        // `resolve.dedupe` alone does not help — it does not apply to
        // externalised SSR dependencies.
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        '@mui/material',
        '@mui/system',
        '@mui/styled-engine',
      ],
      // `i18n-iso-countries` (pulled in by `@wepublish/user`) does
      // `require('./langs/' + code + '.json')` at module init. Rollup cannot
      // follow that and the bundled copy throws
      // "Could not dynamically require ./langs/br.json" on the first request.
      // Keeping it external makes node resolve it normally; nitro traces it
      // into `.output/server/node_modules`.
      external: ['i18n-iso-countries'],
    },

    plugins: [
      // Resolves the `@wepublish/*` path mappings from the workspace
      // tsconfig.base.json. `root` must be the workspace root, not the app.
      // Pinned to the workspace tsconfig: left to auto-discover, it walks
      // `dist/` and chokes on stale generated tsconfigs (libs/api/prisma).
      tsconfigPaths({
        root: workspaceRoot,
        projects: [join(workspaceRoot, 'tsconfig.base.json')],
      }),

      tanstackStart({
        srcDirectory: 'src',
        // Build-time static generation. Disabled by default because it needs a
        // reachable API during `nx build`; CI has none. See docs.
        prerender: {
          enabled: process.env.PRERENDER === '1',
          crawlLinks: false,
          failOnError: false,
          concurrency: 4,
        },
        pages:
          process.env.PRERENDER === '1' ?
            [{ path: '/' }, { path: '/signup' }, { path: '/mitmachen' }]
          : [],
        // We emit our own sitemap at /api/sitemap from the We.Publish API.
        sitemap: { enabled: false },
      }),

      viteReact({
        jsxImportSource: '@emotion/react',
        babel: { plugins: ['@emotion/babel-plugin'] },
      }),

      // Turns the SSR bundle into a runnable server at
      // `.output/server/index.mjs` — the equivalent of Next's
      // `output: 'standalone'`. Without it `vite build` only emits a fetch
      // handler and there is nothing to `node` in the container.
      nitro({
        config: {
          output: { dir: outputDir },
          externals: {
            // `i18n-iso-countries` (via `@wepublish/user`) does
            // `require('./langs/' + code + '.json')` at module init. Rollup
            // cannot follow that, so the bundled copy throws
            // "Could not dynamically require ./langs/br.json" the first time
            // the server handles a request. Keeping it external makes nitro
            // trace it into `.output/server/node_modules` instead.
            external: ['i18n-iso-countries'],
          },
        },
      }),
    ],
  };
});
