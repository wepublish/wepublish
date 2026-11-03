# Migrating a tenant website to TanStack Start

> **Not loaded into every session.** This file is deliberately absent from the
> `@` include list in `.ai/tech-stack.md` — that set is already over its size
> budget. Read it when you touch `apps/gruppetto`, when you migrate the next
> tenant, or when you replay this migration after a rebase.

This is a **replay playbook**, not a write-up. It assumes you are redoing the
migration onto a master that has moved, which is the normal case: every replay
so far has been slowed down less by the migration itself than by master having
quietly changed one of the facts the migration rests on.

So: run the pre-flight first, read what drifted, then follow the steps.

---

## 0. Replay in short

```bash
node tools/tanstack-preflight.mjs            # what changed on master since last time
node tools/split-utils-website-imports.mjs   # PR1: re-route call sites (idempotent)
pnpm nx run-many -t typecheck --exclude=editor
# ... PR2 work ...
pnpm nx run gruppetto:build
PORT=4202 API_URL=https://api-<tenant>.wepublish.works \
  node dist/apps/gruppetto/.output/server/index.mjs &
node tools/tanstack-route-parity.mjs --tag "<a tag that exists>"
```

Three scripts carry the replay. Prefer fixing **them** over editing this prose
when something drifts — a stale script fails loudly, stale prose does not.

| Script | Answers |
| --- | --- |
| `tools/tanstack-preflight.mjs` | do this playbook's assumptions still hold? |
| `tools/split-utils-website-imports.mjs` | route every `@wepublish/utils/website` import to the right barrel |
| `tools/tanstack-route-parity.mjs` | does the migrated app serve what the Next app served? |

Previous attempts are tagged. `git show archive/tanstack-migration-v1:<path>`
is usually faster than rewriting a file from scratch — but **diff it against
master before trusting it**, because the drift is the whole problem (§6.1).

---

## 1. The shape: three barrels

```
@wepublish/utils/website            framework-neutral core   <- no next/*, ever
@wepublish/utils/website/next       Next pages router
@wepublish/utils/website/tanstack   TanStack Router/Start
@wepublish/utils/website/tanstack/server   server-only (cookies, headers, SSR Apollo)
```

The two framework barrels **do not re-export the core**. That is deliberate: an
import line always says which world a symbol comes from, and a file that needs
both carries two imports. It costs 67 double-imports across the tenants and
buys a boundary the compiler enforces.

Dependency direction is strictly `next -> core` and `tanstack -> core`. Nothing
in the core may import either. The pre-flight checks this; `nx lint` does not.

`/tanstack/server` is reachable **only** from inside a `createServerFn` handler
or a literal `server: { handlers }` block — see pitfall 6.2.

On disk the three map one-to-one, so "which world is this file in" is answered
by its directory:

```
libs/utils/website/src/
  index.ts     lib/        framework-neutral core
  next.ts      next/       Next pages router (incl. next.config.js, sentry/instrumentation*)
  tanstack.ts  tanstack/   TanStack Router/Start
```

`lib/sentry/error-no-store.ts` stays in the core on purpose — both
instrumentations import it. `tools/move-next-into-subfolder.mjs` replays the
split and encodes that exception.

---

## 2. Next -> TanStack, conceptually

| Next | TanStack |
| --- | --- |
| `getStaticProps` | route `loader` against `context.apolloClient` |
| `pageProps.__APOLLO_STATE_V1__` | the router's own `dehydrate`/`hydrate` |
| `getStaticPaths` + `fallback:'blocking'` | nothing — render-on-demand is the default |
| `getInitialProps` needing cookies | `createServerFn` + `mergeApolloCache` |
| `getServerSideProps` | a loader plus a `no-store` rule in `src/start.ts` |
| `useRouter().query` | `useQueryParams()` (merges params + search) |
| `router.replace({query}, …, {shallow})` | `useReplaceSearch()` |
| `router.events.on('routeChangeComplete')` | watch `useRouterState({select: s => s.location})` |
| `_app.tsx` + `_document.tsx` | `src/routes/__root.tsx` + `src/app.tsx` |
| `next.config.js#redirects()` | a route that throws `redirect()` |
| `next.config.js#headers()` | a path-based request middleware in `src/start.ts` |
| per-page `revalidate` | `contentCacheControl` on the content loader's response |
| `next.config.js#cacheHandler` | `withPageCache` wrapped around the fetch handler in `src/server.ts` |
| `instrumentation.ts` / `-client.ts` | `/tanstack/sentry` + `/tanstack/sentry/client` |
| `getPageShell` in `getStaticProps` | loader returns `{shell}`; `useWebsiteShell()` reads the deepest match |

**Apollo is per-request without any WeakMap.** `createStartHandler` calls
`getRouter()` once per request, and `getApiClient()` already builds a fresh
client whenever `window` is undefined — so one client per request on the
server, a warm singleton in the browser, and `apolloRouterOptions()` moves the
cache across the wire.

---

## 3. Ordered steps

Order matters; several steps leave the repo un-typecheckable if done early.

**PR1 — the split** (no TanStack, lands independently)

1. Add the `/next` path to `tsconfig.base.json` **before** splitting
   `index.ts`. `vitest.shared.ts` builds aliases from that file at config load,
   so an unmapped specifier fails every Vitest project, not just the typecheck.
2. Write `src/index.ts` (core) and `src/next.ts` (Next). Move the
   `Window.WEBSITE_SETTINGS` augmentation and the Google-Fonts builder into the
   core — a non-Next shell needs both and they were stranded in Next-only files.
3. `node tools/split-utils-website-imports.mjs`.
4. `pnpm nx run-many -t typecheck --exclude=editor` — expect 23/23.

**PR2 — the app**

5. Install the version triple (§4). Add `moduleResolution: "bundler"` +
   `module: "esnext"` to `libs/utils/website/tsconfig.json` **before** adding
   any file that imports `@tanstack/react-start/server`; the base tsconfig
   still uses legacy `node` resolution, which cannot read a package `exports`
   map.
6. Restore the `/tanstack` lib layer, then reconcile it against master.
7. Thread `sitemapPath` through `libs/feed/website`'s `render.ts` **before**
   touching the app's `src/sitemap.ts`, or that file will not typecheck.
8. Swap the app: delete `pages/`, `next.config.js`, `next-env.d.ts`,
   `instrumentation*.ts`; add `vite.config.mts`, `src/routes/**`, `src/start.ts`,
   `src/server.ts`, `src/router.tsx`.
9. Patch the stragglers the pre-flight finds (§6.1).
10. Build, boot, `tools/tanstack-route-parity.mjs`.

**PR3 — the playbook** (this file plus the scripts; no runtime impact)

---

## 4. Versions

The constraint is a triangle: **TanStack Start's vite peer**, **nitro's vite
peer**, and **what the workspace pins**. Re-derive it every replay — the
pre-flight does.

As of the last replay: vite 8.3.5, `@tanstack/react-start` 1.169.4,
`@tanstack/react-router` 1.170.46, `nitro` 3.0.260903-beta.

Two things that are easy to get wrong:

- `@tanstack/react-start` **1.168.61 is the last release peering `vite >=7`**;
  every 1.169.x peers `vite >=8`. If the workspace is on vite 7 you must pin to
  1.168.61 or bump vite.
- nitro's only `latest` tag is a **beta**. Stable `3.0.0` peers `vite ^7`, so on
  vite 8 the beta is the only option. `^3.0.0` does *not* match
  `3.0.260903-beta` under semver, so the beta needs an exact version.

Bumping vite is workspace-wide (every lib's Vitest run). `@nx/vite`,
`@nx/vitest`, `vitest`, `@vitejs/plugin-react` and all three Storybook builders
already accept `^8`.

---

## 5. SSR, SSG and ISR

**SSR** works out of the box, streaming.

**SSG** is `tanstackStart({ prerender })`, gated behind `PRERENDER=1` because it
needs a reachable API at build time. Not a regression — the Next app used
`paths: []` + `fallback: 'blocking'`, so it prerendered nothing either.

**ISR does not exist.** There is no `revalidate`, and `res.revalidate(path)` has
no equivalent. Two things replace it:

1. **The window** — a content loader sets its own `cache-control` from
   `contentCacheControl`, which runs the same `revalidateFor()` the Next apps
   used: an hour for a static page, a minute for one with a live block, an API
   error or missing content, and sooner when a block is scheduled to change.
2. **Everything else** — a path-based request middleware in `src/start.ts`
   covers the routes with no content to judge, and leaves alone any response
   that already decided for itself. **Add every new route to `CACHE_RULES`** —
   a route that is missing gets the default, and for a user-specific page that
   means one visitor's HTML is served to another.
3. **The shared page cache** — `withPageCache` in `src/server.ts` runs the exact
   pod-local-LRU-in-front-of-Dragonfly the Next tenants use, invalidated by the
   namespace versions the API writes. It reads `s-maxage` off the response, so
   the window from step 1 is the one it stores against — this header is the ISR
   window, not merely a hint to the CDN. No-ops without `REDIS_URL`.

---

## 6. Pitfalls, indexed by symptom

Grep the error string.

### 6.1 "it worked last time" — master drifted

Run `node tools/tanstack-preflight.mjs` first. On the most recent replay it
caught, in its first run, two components still importing `next/head`
(`libs/tag/website/.../tag.tsx` and
`libs/content/website/.../content-unavailable.tsx`) that would have crashed a
real tag page and the paywall notice. Neither showed up in a route sweep,
because a *nonexistent* slug 404s before the component renders.

**Always parity-check at least one URL whose content actually exists.**

### 6.2 `"Readable" is not exported by "__vite-browser-external"`

Server-only code reached the client bundle. The plugin strips the client build
by deleting the **literal** `server: { handlers: {…} }` property from the
`createFileRoute` call — so page routes may come from a factory, but server
routes must spell the block out and call a shared handler:

```ts
export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => sitemapHandler(getSitemap, getSiteUrl) } },
});
```

### 6.3 Pages render with a complete shell but **no content**

`ssrForceFetchDelay` turns cache prioritisation off N ms after the client is
built, *even when `ssrMode` is true*. The Next apps got away with it by building
the client during the render; TanStack builds it at request start, so the timer
always wins. `libs/website/api/src/lib/client.tsx` sets it to `0` on the server.
See the gotchas entry — do not "simplify" it back.

### 6.4 `Cannot find module './langs/br.json'`

`i18n-iso-countries` does a dynamic `require` at module init. It must stay a
real external and be traced into `.output/server/node_modules`.

**nitro renamed this option.** `config.externals.external` is gone in nitro 3
beta and is **silently ignored**; use `traceDeps: ['i18n-iso-countries*',
'@keyv/redis*']` (`pkg*` = full package trace). Vite's `ssr.external` alone is
not enough, because nitro bundles externals afterwards.

### 6.5 `theme.spacing is not a function` (dev only)

Emotion resolved twice — MUI's styled engine gets the CJS build, the app gets
ESM, so there are two ThemeContexts. `ssr.noExternal` the emotion/MUI set and
spell out `ssr.resolve.conditions`. `resolve.dedupe` does **not** help; it does
not apply to externalised SSR deps.

### 6.6 `No "X" export is defined on the "./y.model" mock`

Vite 8 only. `emitDecoratorMetadata` emits runtime references to decorated
parameter types; vite 7 elided them, vite 8 evaluates them. Any partial
`vi.mock` of a NestJS model module must now list **every** class the service
under test imports — add `X: class {}` stubs. The pre-flight lists the specs in
this repo that are exposed to it.

### 6.7 The codemod reports success and half the tenants still fail

The tenant pages are mostly **re-export shims**
(`export { FourOhFourPage as default } from '…'`), not imports. An
import-only codemod silently misses ~82 files. `split-utils-website-imports.mjs`
matches `(import|export) … from`; keep it that way.

### 6.8 Four files survive a stack split that should not

When reconstructing branches, `git diff --diff-filter=D` **excludes renames**.
`pages/login.tsx` -> `src/routes/login.tsx` is an R, not a D, so the old file
is never deleted. Use `--no-renames`, and always verify the top of the stack
against a snapshot branch — the diff must be empty.

### 6.9 Two `<title>` tags

React 19 hoists metadata but does not deduplicate, and the **first** wins
(`next/head` merged by `key` and the last won). The shell must never render a
default title: either a route's `head()` sets it, or an SEO component does —
never both.

### 6.10 Spurious 307 on first load

A zod `.default()` in `validateSearch` makes TanStack canonicalise the URL and
redirect. Keep `validateSearch` free of defaults; apply them when reading.

### 6.11 A 404 page served with status 200

TanStack derives the SSR status from a thrown `notFound()`, not from which
component rendered. Prefetch the CMS 404 page, then `throw notFound()`.

### 6.12 An authenticated page cached and served to strangers

The single worst class of bug here, and it is silent. A route whose loader
reads the auth cookie — anything using a loader from `tanstack/routes/account.ts`
— dehydrates `Me`/`Invoices` **into the HTML**. The page cache keys on
pathname+search only, so if that path is missing from `CACHE_RULES` it gets the
60s default and one subscriber's data is served to every later visitor, from
Dragonfly *and* the CDN's 7-day SWR window.

`/mitmachen` shipped with exactly this (Next had marked it `no-store`; the port
dropped it). When adding an authenticated route, add the `no-store` rule in the
same commit — and prefer a test that walks the account loaders and asserts each
of their paths resolves to `NO_STORE`, because a hand-maintained path list will
drift again.

### 6.13 `deployed_version` returns the 404 page and the deploy hangs

nitro bakes a **build-time glob** of `.output/public` into the server bundle;
anything copied in afterwards is never served. A post-build
`COPY version .output/public/deployed_version` therefore resolves to the splat
route, and the publish workflow's "Wait for frontend to be deployed" step polls
it 120 times before failing — ~20 minutes, on a pod that is perfectly healthy.
Write the file into `apps/<app>/public/` *before* `nx build`.

(Next survives the same Dockerfile shape because it serves `public/` from disk
at request time.)

### 6.14 `stale-while-revalidate` on the browser-facing header

`cache-control` is read by the browser too. `max-age=59,
stale-while-revalidate=604800` lets a returning visitor's own cache serve
week-old HTML — Next never did that. Keep the long SWR window on
`s-maxage`/CDN headers and leave the browser policy at
`public, max-age=59, stale-if-error=86400`.

### 6.15 Build/runtime odds and ends

- `vite.config.mts`, not `.ts` — the Start plugin is ESM-only and a `.ts`
  config in a CJS package gets `require`d.
- `NODE_OPTIONS=--max-old-space-size=8192` or nitro OOMs on this workspace.
- Emotion cache **per render** on the server, or request two ships no styles.
- SVG imports are URL strings under Vite, objects under Next (`markUrl.src`).
- Stale `dist/` inside the project gets linted; keep it in `.gitignore` *and*
  the eslint ignores.

---

### 6.16 `Cannot find module 'react'` in the container, green build locally

The single most expensive trap so far, because **a local build cannot see it.**

Vite externalises `react` for the SSR environment. Rolldown inlines any CJS
dependency it cannot externalise safely and emits a literal `__require("react")`
inside it; nitro's second pass resolves `import`s but cannot rewrite an
already-emitted `__require`. `.output` ships without a `node_modules`, so every
render of a route reaching that module dies — while `nx build` exits 0.
Upstream closed this as working-as-intended:
[rolldown#10643](https://github.com/rolldown/rolldown/issues/10643).

Two modules in this graph do it: `react-transition-group/cjs/TransitionGroupContext.js`
(MUI hardcodes that CJS path) and `use-sync-external-store/shim` (via `swr` and
`@tanstack/react-store`). `use-sync-external-store/shim/with-selector` would be
a third if anything pulled it in. The fix is `resolve.alias` onto their ESM
equivalents — `react` itself has `useSyncExternalStore` since 18.

**Both obvious alternatives are worse, and both look like they work:**

- `react`/`react-dom` in `ssr.noExternal` removes the require, then gives
  react-dom/server a second copy of React. Every render dies on
  `Cannot read properties of null (reading 'useState')`.
- `react*` in the nitro `traceDeps` removes the error entirely and degrades SSR
  to an empty shell that still returns **200**.

**Why your machine will not reproduce it.** It only happens when the CJS
package is not reachable from the *root* `node_modules`. A workspace carrying
hoisted leftovers from the npm era resolves those packages to their ESM builds
and is permanently clean; CI's `pnpm install --frozen-lockfile` is not. Check
with `ls node_modules/react-transition-group node_modules/use-sync-external-store`
— if those exist, your tree is lying to you.

To reproduce a CI build, never trust the working tree:

```sh
git archive --format=tar -o /tmp/src.tar HEAD
mkdir /tmp/clean && tar xf /tmp/src.tar -C /tmp/clean && cd /tmp/clean
pnpm install --frozen-lockfile && pnpm exec prisma generate
pnpm exec nx build <app> --skip-nx-cache
node docker/check-nitro-output.js dist/apps/<app>/.output
```

Installing reuses the pnpm store, so this costs minutes, not a full download.
Then **boot the output and curl a route** — the guard catches an unresolvable
require, but only a real render catches a null dispatcher or an empty shell:

```sh
cd dist/apps/<app>/.output && PORT=4299 API_URL=<api> node server/index.mjs
curl -s http://localhost:4299/login | wc -c   # a shell is ~2 KB, a page ~90 KB
```

`docker/check-nitro-output.js` runs in the `build-website-tanstack` stage and
fails the image build on any runtime `require()` that is neither bundled,
traced, nor a node builtin. The same class of bug hid
`@sentry/server-runtime-injection`, a static import of `@sentry/node` that
nitro did not trace — add it to `traceDeps`.

---

## 7. Deployment

`Dockerfile` has `build-website-tanstack` / `website-tanstack-setup` /
`website-tanstack`, mirroring the Next trio but copying nitro's self-contained
`.output` instead of `.next/standalone`, with `startup-config.json` pointing at
`.output/server/index.mjs` so `map-secrets.js restore --start` is unchanged.

`on-demand-publish-docker-image-website.yml` picks the target by testing for
`apps/<project>/vite.config.mts`, so no caller workflow changes and the next
tenant switches automatically.

Two traps:

- The workflow puts **Next-only flags** in `NX_NEXT_PROJECT_BUILD_OPTIONS`
  (`--experimental-build-mode compile`) — but only when `prerender` is false.
  Review passes `prerender: true`, so **review deploys fine while staging and
  master-push would break**. The TanStack stage does not forward that variable.
- `/api/health` is a hard contract: the helm chart probes it for liveness,
  readiness *and* startup. `deployed_version` must stay served at the site root.

---

## 6b. The session on render one

`SessionProvider` seeds its state from `pageProps.sessionToken` and only reads
the cookie afterwards, in an effect. Next filled that prop from the page's
`getInitialProps`; here `useRouteSessionToken` reads it off the matched
routes, because the authenticated loaders in
`libs/utils/website/src/tanstack/routes/account.ts` already return it.

Do not drop it and rely on the cookie effect alone. A first render that is
logged out when the reader is not is a bug in its own right, not a frame of
latency — `/mitmachen` starts `useQuery(ChallengeDocument, {skip: hasUser})`
on render one and skips it on render two, which leaves Apollo at
`loading: true` forever and permanently disables the subscribe button. It only
shows on a direct entry; a client-side navigation already has the session.

Routes that do not authenticate still get `null`, so their HTML stays user
agnostic and CDN cacheable.

---

## 6c. The React Compiler

`apps/gruppetto` compiles, like `apps/editor`:
`['babel-plugin-react-compiler', { target: '19' }]` ahead of
`@emotion/babel-plugin` in `vite.config.mts` — ahead, because the compiler
reads the JSX that emotion's plugin would otherwise have rewritten into calls.

Its lint rules come with it. `eslint.config.mjs` uses nx's **`flat/react`**,
not `flat/react-typescript`: only the former registers `react-hooks`,
`jsx-a11y`, `react` and `import`. The typescript variant registers no plugins
at all, which is how this app ended up with no React or a11y lint when
`eslint-config-next/core-web-vitals` left with Next. Do not reach for the Next
config to get them back — 44 of its rules are `@next/next/*` and assume
`next/image`, `next/head` and a pages directory.

`reactCompilerRules('error')` from the root config then switches on the
compiler's own diagnostics, the same way the editor projects do. The first run
found one real defect: `routes/login.tsx` wrote a ref, set cookies and
navigated *during render*, so a double render consumed the intended route
twice. Both now live in effects.

---

## 7b. Sentry

`@sentry/tanstackstart-react` — not `@sentry/node` + `@sentry/react`. It
resolves to one or the other through its exports map and adds the Start-aware
pieces on top, so both sides configure the *same* client.

Four places, and the order of each matters:

- `src/instrument.server.ts` → built separately by
  `vite.instrument.config.mts` into `.output/server/instrument.server.mjs` and
  loaded through `node --import`. `Sentry.init` has to run before the server
  bundle is evaluated or auto-instrumentation attaches to nothing.
- `src/server.ts` wraps the entry in `wrapFetchWithSentry`, **outside**
  `withPageCache`: it opens the request span and writes the `sentry-trace`
  meta tags, both of which are per-request and must not be stored with a
  cached page.
- `src/start.ts` puts `sentryGlobalRequestMiddleware` /
  `sentryGlobalFunctionMiddleware` first in their arrays — behind
  `createIsomorphicFn`, because a top-level import of the SDK from this file
  lands all of `@sentry/react` in the browser entry chunk (+457 KB raw /
  +152 KB gzip, measured).
- `vite.config.mts` runs `sentryTanstackStart` last, for source map upload and
  the route-pattern table that names request spans `GET /a/$slug` rather than
  one bucket per article. `autoInstrumentMiddleware: false`, for the same
  bundle reason — it injects an SDK import into `start.ts` in both
  environments. `@sentry/tanstackstart-react` must therefore stay *out* of
  `ssr.external` — the plugin can only substitute the table into a module it
  bundles — while still being listed in nitro's `traceDeps`, because the
  `--import` preload is a separate build that resolves it at runtime.

The build prints a warning that `@redis/client` is external and "needs to be
bundled for Sentry instrumentation to work". It is a false positive here — the
`--import` preload is exactly the runtime instrumentation the message points at
as the alternative.

---

## 8. Known gaps

- **`website-shell` on a bespoke route.** The shared factories already return
  `{shell}` (`homePageRoute`, `pageBySlugRoute`), and `app.tsx` reads it with
  one `useWebsiteShell()` call, so the per-page wiring every Next tenant
  repeats is gone. A route that composes its own loader still has to return
  `shell` itself — `routes/mitmachen.tsx` is the one such case — and forgetting
  it silently ignores the CMS `hideHeader`/`hideFooter` flags.
  `routes/content.spec.tsx` guards the shared factories against the same slip;
  nothing can guard a route that has not been written yet.
- **The image is unverified locally.** `dhi.io/node` needs auth; CI overrides
  those ARGs. Validate with public bases:
  `podman build --target website-tanstack --build-arg BUILD_IMAGE=node:22 …`
