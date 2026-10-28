/// <reference types="vitest" />
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, Plugin } from 'vite';
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

const PAGE_CACHE_CJS = /\/libs\/utils\/website\/src\/lib\/page-cache\/[^/]+\.js$/;

/**
 * `vite dev` only: hand the SSR module runner a real `require()` of the page
 * cache.
 *
 * `libs/utils/website/src/lib/page-cache/*.js` is CommonJS on purpose — Next
 * `require()`s it at runtime from that source path, see
 * `build.commonjsOptions` below. The production build therefore runs it
 * through rollup's CJS interop, but dev has no such step for workspace
 * *source*: Vite inlines the file into the SSR module runner as ESM and it
 * dies on its own `module.exports` with "module is not defined", taking
 * `src/server.ts` — and with it every request — down with it.
 *
 * Deferring to node's CJS loader keeps dev on exactly the same files the
 * build bundles, rather than on a second, ESM copy of the cache.
 */
const pageCacheCommonJs = (): Plugin => ({
  name: 'wepublish:page-cache-commonjs',
  apply: 'serve',
  enforce: 'pre',

  load(id) {
    const file = id.split('?')[0];

    if (!PAGE_CACHE_CJS.test(file)) {
      return null;
    }

    // Both modules export exactly one factory; destructuring the one that is
    // not there is harmless, the importer never reads it.
    return [
      `import { createRequire } from 'node:module';`,
      `const required = createRequire(${JSON.stringify(import.meta.url)})(${JSON.stringify(file)});`,
      `export const { createPageCache, createSharedStore } = required;`,
      `export default required;`,
    ].join('\n');
  },
});

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

    build: {
      commonjsOptions: {
        // `libs/utils/website/src/lib/page-cache/*.js` is CommonJS on
        // purpose: Next `require()`s `page-cache-handler.js` at runtime from
        // that source path, outside any bundler, so it cannot be ESM. Vite
        // only runs the CJS interop over `node_modules`, so workspace source
        // has to be opted in by hand — without this the server build dies
        // with `"createSharedStore" is not exported by shared-store.js`.
        // Re-listing `/node_modules/` is required: `include` replaces the
        // default rather than extending it.
        include: [/node_modules/, /libs\/utils\/website\/src\/lib\/page-cache\//],
      },
    },

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
      // Vite externalises `react` for the SSR environment, so rolldown emits a
      // literal `__require("react")` inside any CJS dependency it inlines, and
      // nitro's second pass cannot rewrite it. `.output` ships without a
      // `node_modules`, so that call throws "Cannot find module 'react'" on
      // every render of a route that reaches one. These two specifiers are the
      // only CJS modules in the graph that `require('react')`; both have an
      // ESM equivalent, so pointing at it removes the require entirely.
      //
      // Putting `react` in `ssr.noExternal` also removes the require, but
      // gives react-dom/server a second copy of React and every render then
      // dies on a null hook dispatcher. Adding `react` to the nitro
      // `traceDeps` is worse still: SSR silently degrades to an empty shell
      // and keeps returning 200. See `docker/check-nitro-output.js`, which
      // fails the image build if a third such module ever appears.
      alias: [
        {
          find: 'react-transition-group/cjs/TransitionGroupContext.js',
          replacement: 'react-transition-group/esm/TransitionGroupContext.js',
        },
        {
          find: /^use-sync-external-store\/shim(\/index\.js)?$/,
          replacement: 'react',
        },
      ],
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
      //
      // `lodash` deliberately is NOT in this list. It is CJS, and the dev SSR
      // module runner inlines a `noExternal` dependency *without* CommonJS
      // interop, so the first `require` inside it throws "require is not
      // defined". Externalised, node loads it as the CJS it is. That rules
      // out `import { escape } from 'lodash'` — cjs-module-lexer cannot find
      // named exports in the lodash barrel — so
      // `libs/feed/website/src/lib/sitemap/xml.ts` imports `lodash/escape`
      // instead, whose `module.exports = escape` is a plain default.
      noExternal: [
        'react-tweet',
        '@mui/x-date-pickers',
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
      // `@redis/client` is the page cache's Dragonfly client, reached through
      // a bare `require()` in `shared-store.js`. External, so nitro traces it
      // into `.output/server/node_modules`; bundling it would leave that
      // require unresolvable at runtime.
      // The Sentry packages are external so the `--import` preload
      // (`instrument.server.ts`, which runs `Sentry.init` before this bundle
      // is even loaded) and the bundle resolve the *same* module instance
      // from `.output/server/node_modules`. Two copies would each build their
      // own client and the one the app captures through would not be the one
      // the preload configured.
      //
      // `@sentry/tanstackstart-react` is deliberately NOT in this list. Its
      // own Vite plugin sets `noExternal` on it for the server build so it can
      // substitute the route-pattern table into `wrapFetchWithSentry` — an
      // external copy is never transformed, and every request span is then
      // named after the raw URL instead of its route, which makes the trace
      // view one bucket per article. The wrapper sitting in the bundle is
      // harmless: the client it reaches for lives on `globalThis.__SENTRY__`,
      // keyed by SDK version, so it is the one the preload configured.
      external: [
        'i18n-iso-countries',
        '@redis/client',
        '@sentry/node',
        '@sentry/profiling-node',
      ],
    },

    plugins: [
      pageCacheCommonJs(),

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
          traceDeps: [
            'i18n-iso-countries*',
            '@redis/client*',
            '@sentry/node*',
            '@sentry/profiling-node*',
            '@sentry/server-runtime-injection*',
          ],
        },
      }),

      // Last on purpose: it reads the finished bundle. It is here for source
      // maps — without an upload, every stack trace from the browser bundle
      // is unreadable minified output. No auth token means nothing to upload
      // to, so a local `nx build` skips that half instead of failing;
      // `SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT` are build args the Dockerfile
      // already passes.
      //
      // `autoInstrumentMiddleware` is off. It rewrites the middleware arrays
      // in `src/start.ts` and adds a `@sentry/tanstackstart-react` import to
      // that file in *both* environments — which in the browser is the entire
      // `@sentry/react` surface, the 457 KB `src/start.ts` goes out of its way
      // to keep out of the entry chunk. What it buys is a span around
      // `cacheHeaders` and `csrf`, two header reads.
      //
      // `telemetry` is off because a build should not call out to a third
      // party; CI builds run unattended and nobody consented for them.
      ...sentryTanstackStart({
        autoInstrumentMiddleware: false,
        telemetry: false,
        ...(process.env.SENTRY_AUTH_TOKEN ?
          {
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.SENTRY_RELEASE },
          }
        : { sourcemaps: { disable: true } }),
      }),
    ],
  };
});
