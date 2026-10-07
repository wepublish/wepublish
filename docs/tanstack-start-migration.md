# Migrating a tenant website from Next.js to TanStack Start

This is the working record of migrating **gruppetto** off the Next.js pages
router onto TanStack Start, written so it can be re-run — either to migrate the
next tenant, or to redo this one after a messy merge conflict.

It is deliberately long. Every section that says *"this bit out, that bit in"*
is mechanical; the sections marked **⚠ Pitfall** are the ones that cost real
debugging time and that you will hit again.

> **Status.** gruppetto is migrated and `apps/gruppetto` is now a TanStack
> Start app. The other 19 tenant websites are still Next.js and keep working
> unchanged — both frameworks coexist in the monorepo.

**Contents**

1. [What actually changes](#1-what-actually-changes)
2. [The mental model](#2-the-mental-model)
3. [Step-by-step migration](#3-step-by-step-migration)
4. [Route mapping table](#4-route-mapping-table)
5. [SSR, SSG and ISR — what you really get](#5-ssr-ssg-and-isr--what-you-really-get)
6. [⚠ Pitfalls](#6--pitfalls)
7. [Deployment](#7-deployment)
8. [Verification checklist](#8-verification-checklist)
9. [Open questions / things to double-check](#9-open-questions--things-to-double-check)

---

## 1. What actually changes

### Packages added

| Package | Why |
| --- | --- |
| `@tanstack/react-start` | the framework (SSR, server functions, Vite plugin) |
| `@tanstack/react-router` | file-based router |
| `nitro` (devDependency) | turns the SSR bundle into a runnable server — the equivalent of Next's `output: 'standalone'` |

Versions at time of writing: `@tanstack/react-start@1.168`,
`@tanstack/react-router@1.170`, `nitro@3.0.0`. TanStack Start requires
`vite >= 7`; the workspace is on 7.3.6, so no Vite upgrade was needed.

### Library changes (shared, affects all tenants)

The website libraries were already almost framework-agnostic: components get
`Link`, `Head` and `Script` injected through `WebsiteBuilderProvider`, so they
never import `next/*` themselves. Only **three** files in `libs/` imported
Next at all, and only one package was really coupled:

```
libs/utils/website/**   ← 16 files, the whole Next glue layer
libs/tag/website/src/lib/tag.tsx   ← imported `next/head` directly
libs/storybook/...      ← irrelevant to runtime
```

So the entire surface to port was `libs/utils/website`. It is now split into
three entry points:

| Entry point | Contents | Safe to import from |
| --- | --- | --- |
| `@wepublish/utils/website` | the **Next** implementation (unchanged behaviour) | Next apps only |
| `@wepublish/utils/website/core` | framework-neutral: `getApiUrl`, auth links, session providers, i18n, `withJwtHandler` | anywhere |
| `@wepublish/utils/website/tanstack` | the TanStack implementation: link, head/script shims, router hooks, admin bar, analytics, ported pages, reusable route options | TanStack apps |
| `@wepublish/utils/website/tanstack/server` | **server-only** helpers (cookies, request headers, authenticated Apollo client) | inside `createServerFn` handlers and `server.handlers` blocks only |

`index.ts` re-exports `core`, so nothing in the Next apps changed. The split is
purely additive.

Two shared files changed behaviour:

- **`libs/website/api/src/lib/client.tsx`** — `ssrForceFetchDelay` is now `0`
  on the server. See [Pitfall 1](#pitfall-1-the-empty-page-ssrforcefetchdelay);
  this was a latent bug in the Next apps too.
- **`libs/tag/website/src/lib/tag.tsx`** — uses the injected `Head` from
  `useWebsiteBuilder()` instead of `next/head`. Behaviour is identical under
  Next.
- **`libs/user/website/.../totp-qr-code.tsx`** — normalises a `.png` import,
  which Next resolves to `{ src }` and Vite to a plain URL string.

### App changes

`apps/gruppetto/pages/**` is gone. The new layout:

```
apps/gruppetto/
  vite.config.mts          ← replaces next.config.js
  project.json             ← nx:run-commands around vite, instead of @nx/next
  index.d.ts               ← *.svg is a string here, not StaticImageData
  src/
    server.ts              ← server entry: the shared page cache (ISR)
    start.ts               ← request middleware: the CDN cache headers
    router.tsx             ← createRouter + Apollo wiring
    routeTree.gen.ts       ← GENERATED, never edit
    app.tsx                ← what pages/_app.tsx rendered
    theme.ts
    feed.ts  sitemap.ts    ← take a URL string instead of NextApiRequest
    integration/
      public-env.ts        ← runtime env -> window.PUBLIC_ENV
    components/            ← footer, break-block
    routes/                ← mirrors the old pages/ directory
```

Gone with no replacement: `_document.tsx`, `_error.tsx`, `next-env.d.ts`,
`instrumentation.ts`, `instrumentation-client.ts` (see
[Open questions](#9-open-questions--things-to-double-check) re Sentry).

---

## 2. The mental model

Hold these four mappings in your head and most of the migration writes itself.

### 2.1 `getStaticProps` → route `loader` (via the router's Apollo client)

Next prefetched into a throwaway Apollo client, extracted the cache, and
shipped it as `pageProps.__APOLLO_STATE_V1__`, which `_app` restored.

TanStack does the same thing with **one** client per request, carried in the
router, and transferred by the router's own `dehydrate`/`hydrate` hooks — the
same mechanism the official TanStack Query integration uses:

```ts
// src/router.tsx
export function getRouter() {
  const apolloClient = createRouterApolloClient();

  return createRouter({
    routeTree,
    ...apolloRouterOptions(apolloClient), // context + dehydrate + hydrate
  });
}
```

```ts
// any route
loader: ({ context: { apolloClient } }) =>
  apolloClient.query({ query: PageDocument, variables: { slug } }),
```

Why this is safe: `createStartHandler` calls `getRouter()` **once per request**
on the server, and `getApiClient()` already returns a brand-new client whenever
`window` is undefined. Two concurrent requests can never see each other's
cache. In the browser it is the usual warm singleton.

There is no `addClientCacheToProps`, no `pageProps`, no manual merge.

### 2.2 `getInitialProps` that needs cookies → `createServerFn`

The router's Apollo client is deliberately **anonymous**, so the SSR HTML stays
user-agnostic and CDN-cacheable. Pages that need the auth cookie (`/profile*`,
`/mitmachen`, `/login`) use a server function with its own short-lived
authenticated client, and merge the resulting cache in:

```ts
loader: async ({ context: { apolloClient }, deps: { jwt } }) => {
  const { sessionToken, apollo } = await loadProfile({ data: { jwt } });
  mergeApolloCache(apolloClient, apollo);
  return { sessionToken };
},
```

Those routes are `no-store` (see `src/start.ts`).

### 2.3 `next/router` → TanStack hooks

| Next | TanStack (from `@wepublish/utils/website/tanstack`) |
| --- | --- |
| `useRouter().query` | `useQueryParams()` — merges route params + search params, which is what `router.query` was |
| `useRouter().asPath` | `useAsPath()` |
| `router.replace({query}, undefined, {shallow:true})` | `useReplaceSearch()(prev => ({...prev, page}))` |
| `router.push('/x')` | `useNavigate()({ to: '/x' })` |
| `router.events.on('routeChangeComplete')` | watch `useRouterState({ select: s => s.location.pathname })` |
| `withBuilderRouter` | `<BuilderRouterProvider>` |

There is no `shallow` flag. TanStack re-runs the loaders whose `loaderDeps`
changed — which is *better* for the list pages: Next only prefetched page 1 and
let Apollo fetch the rest client-side, whereas every page is now server
rendered.

### 2.4 `_document.tsx` + `_app.tsx` → `__root.tsx`

`__root.tsx` owns the `<html>` shell, the head links, the inline globals
(`window.PUBLIC_ENV`, `window.WEBSITE_SETTINGS`), the emotion cache, the MUI
theme, the Apollo provider and the app chrome.

---

## 3. Step-by-step migration

Re-runnable recipe for tenant `<app>`.

### Step 1 — config files

Delete `next.config.js`, `next-env.d.ts`, `instrumentation*.ts`. Add:

**`vite.config.mts`** — copy `apps/gruppetto/vite.config.mts` and change the
port and `cacheDir`. Note the `.mts` extension; see
[Pitfall 3](#pitfall-3-vite-config-must-be-mts).

**`index.d.ts`**:

```ts
/// <reference types="vite/client" />
declare module '*.svg' {
  const url: string;
  export default url;
}
```

**`project.json`** — replace the `@nx/next:*` executors with
`nx:run-commands` around `vite`. Copy from `apps/gruppetto/project.json`.
`@nx/vite/plugin` also infers `dev`/`browser`/`serve-static` targets; the
explicit ones in `project.json` win.

**`nx.json`** — the project path is already in the `@nx/eslint/plugin`
`include` list; leave it.

**`eslint.config.mjs`** — drop `eslint-config-next`, keep the nx React preset,
and ignore `routeTree.gen.ts`, `.output`, `.nitro`, `.tanstack`, `dist`.

**`.gitignore`** — `.output`, `.nitro`, `.tanstack`, `dist`.

### Step 2 — the shell

Port `pages/_app.tsx` into `src/app.tsx` and `src/routes/__root.tsx`:

- theme + `SITE_TITLE` → `src/theme.ts`
- everything inside the Apollo provider → `src/app.tsx`
- `<html>`, `<head>`, emotion cache, providers → `src/routes/__root.tsx`
- `pages/_document.tsx`'s feed/sitemap `<link>`s → the root route's `head()`
- `documentGetInitialProps`'s font logic → `websiteSettingsFontLinks()`
- `@next/third-parties/google` + `next-plausible` → `<Analytics>` from the
  tanstack barrel (plain script tags; React 19 hoists them)

### Step 3 — routes

Create `src/routes/` mirroring the old `pages/` directory. **Nested folders
work** — `src/routes/a/$slug.tsx` → `/a/$slug`. Flat (`a.$slug.tsx`) and
nested are interchangeable; nested reads better and matches `pages/`.

Most routes are now one line, because the loader + component live in the
library:

```tsx
// src/routes/a/$slug.tsx
import { createFileRoute } from '@tanstack/react-router';
import { articleBySlugRoute } from '@wepublish/utils/website/tanstack';

export const Route = createFileRoute('/a/$slug')(articleBySlugRoute());
```

Available factories (`libs/utils/website/src/tanstack/routes/`):

| Factory | Replaces |
| --- | --- |
| `homePageRoute()` | `pages/index.tsx` |
| `pageBySlugRoute()` / `pageByIdRoute()` | `pages/[slug].tsx`, `pages/id/[id].tsx` |
| `articleListRoute({take, canonicalUrl})` | `pages/a/index.tsx` |
| `articleBySlugRoute(props)` / `articleByIdRoute(props)` | `pages/a/[slug].tsx`, `pages/a/id/[id].tsx` |
| `tagRoute()` | `pages/a/tag/[tag].tsx` |
| `authorListRoute()` / `authorRoute()` | `pages/author/*` |
| `eventListRoute()` / `eventRoute()` | `pages/event/*` |
| `searchRoute()` | `pages/search.tsx` |
| `profileRoute()`, `subscriptionRoute()`, `deactivatedSubscriptionsRoute()` | `pages/profile/**` |
| `subscribeRouteLoader`, `loginRouteLoader`, `loginSearchSchema` | loaders only — the components stay in the app, the copy is tenant specific |
| `notFoundSplatRoute()` | the `/404` fallback for unmatched deep paths |
| `redirectRoute(to, {permanent})` | `next.config.js#redirects()` |

Anything genuinely tenant-specific (gruppetto's member-plan filter, the eager
link prefetching on the home page) stays in the app's route file and spreads
the factory:

```tsx
export const Route = createFileRoute('/')({
  ...homePageRoute(),
  component: () => (
    <LinkContext.Provider value={{ prefetch: true }}>
      <PageContainer slug={''} />
    </LinkContext.Provider>
  ),
});
```

### Step 4 — API routes

`pages/api/*` become server routes. **Write the `server: { handlers }` block
out literally** — see [Pitfall 6](#pitfall-6-server-routes-cannot-come-from-a-factory).

Feeds and sitemaps moved to conventional paths, with 301s from the old ones:

| Old | New |
| --- | --- |
| `/api/sitemap` | `/sitemap.xml` |
| `/api/rss-feed` | `/rss.xml` |
| `/api/atom-feed` | `/atom.xml` |
| `/api/json-feed` | `/feed.json` |
| `/api/health` | **unchanged** — it is the k8s probe path in `helm/charts/wepublish-website/templates/website.yaml` |
| `/api/revalidate` | **removed** — invalidation is version-driven, see [§5](#5-ssr-ssg-and-isr--what-you-really-get) |

The legacy paths must keep resolving: they are in already-crawled
`<link rel="alternate">` tags and, more importantly, in every existing
feed-reader subscription. Remember to update `public/robots.txt` and the
`feedLinks` in `src/feed.ts`.

A literal dot in a route path is escaped with `[.]` in the filename:
`src/routes/sitemap[.]xml.ts` → `/sitemap.xml`. Without the brackets, `.` is
the path separator and you would get `/sitemap/xml`.

### Step 5 — caching

Two files, both covered in [§5](#5-ssr-ssg-and-isr--what-you-really-get):

- `src/start.ts` — a request middleware that applies the CDN `cache-control`
  policy by path. This is also what decides what the page cache may store.
- `src/server.ts` — the server entry, wrapped in `withPageCache` so the origin
  keeps its own shared copy of every rendered document.

`src/server.ts` also needs the two `build.commonjsOptions` entries in
`vite.config.mts` — see
[Pitfall 14](#pitfall-14-the-page-cache-is-commonjs-and-its-redis-client-is-esm).

### Step 6 — verify

See the [checklist](#8-verification-checklist).

---

## 4. Route mapping table

| Next page | TanStack route file | URL |
| --- | --- | --- |
| `pages/index.tsx` | `src/routes/index.tsx` | `/` |
| `pages/[slug].tsx` | `src/routes/$slug.tsx` | `/:slug` |
| `pages/id/[id].tsx` | `src/routes/id/$id.tsx` | `/id/:id` |
| `pages/a/index.tsx` | `src/routes/a/index.tsx` | `/a` |
| `pages/a/[slug].tsx` | `src/routes/a/$slug.tsx` | `/a/:slug` |
| `pages/a/id/[id].tsx` | `src/routes/a/id/$id.tsx` | `/a/id/:id` |
| `pages/a/tag/[tag].tsx` | `src/routes/a/tag/$tag.tsx` | `/a/tag/:tag` |
| `pages/author/index.tsx` | `src/routes/author/index.tsx` | `/author` |
| `pages/author/[slug].tsx` | `src/routes/author/$slug.tsx` | `/author/:slug` |
| `pages/event/index.tsx` | `src/routes/event/index.tsx` | `/event` |
| `pages/event/[id].tsx` | `src/routes/event/$id.tsx` | `/event/:id` |
| `pages/login.tsx` | `src/routes/login.tsx` | `/login` |
| `pages/signup.tsx` | `src/routes/signup.tsx` | `/signup` |
| `pages/search.tsx` | `src/routes/search.tsx` | `/search` |
| `pages/mitmachen.tsx` | `src/routes/mitmachen.tsx` | `/mitmachen` |
| `pages/profile/index.tsx` | `src/routes/profile/index.tsx` | `/profile` |
| `pages/profile/subscription/[id].tsx` | `src/routes/profile/subscription/$id.tsx` | `/profile/subscription/:id` |
| `pages/profile/subscription/deactivated.tsx` | `src/routes/profile/subscription/deactivated.tsx` | `/profile/subscription/deactivated` |
| `pages/404.tsx` | *no route* — `FourOhFourPage` is the `notFoundComponent`, plus `src/routes/$.tsx` for deep unmatched paths | — |
| `pages/_error.tsx` | *dropped* — TanStack uses `errorComponent` | — |
| `next.config.js` redirect `/abo` | `src/routes/abo.tsx` | `/abo` → `/mitmachen` (307) |
| `next.config.js` redirect `/profile/subscription` | `src/routes/profile/subscription/index.tsx` | → `/profile` (308) |

`getStaticPaths` has **no equivalent and needs none**: every tenant used
`fallback: 'blocking'` with an empty `paths` array, i.e. "render on first
request", which is TanStack's default.

---

## 5. SSR, SSG and ISR — what you really get

### SSR ✅

Works out of the box, streaming, via `renderRouterToStream`. Verified:
`/` server-renders 15 KB of article text with no client JS.

### SSG (prerendering) ✅ but off by default

`tanstackStart({ prerender: { enabled }, pages: [...] })` renders selected
routes to static HTML at build time. It is **enabled only when `PRERENDER=1`**
because it needs a reachable API during `nx build`, and CI has none.

This is not a regression: the Next app's `paths: []` + `fallback: 'blocking'`
meant **nothing was prerendered at build time either**. Everything was
render-on-demand plus caching, which is exactly what we have now.

### ISR ✅ — the shared page cache, ported

TanStack Start has no `next.config.js#cacheHandler`. What it has instead is
`src/server.ts`, a plain fetch handler wrapping the whole request — which turns
out to be strictly more control, because the cache check runs **before** the
router boots, so a hit never instantiates it.

So the cache itself was not rewritten. `libs/utils/website/src/lib/page-cache/`
— the two-tier LRU, the namespace-version checks, the render lock, the
Dragonfly client — is the exact code the 19 Next tenants run, and the
invalidation protocol the api writes (`nsv:website:pages`,
`nsv:website:path:<path>`, `website:heartbeat`; see `libs/kv-ttl-cache/api`) is
untouched. One publish invalidates a TanStack tenant and a Next tenant through
the same key.

Only the adapter is new:

```ts
// apps/gruppetto/src/server.ts
import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { withPageCache } from '@wepublish/utils/website/tanstack/server';

export default createServerEntry({
  fetch: withPageCache(handler.fetch),
});
```

`withPageCache` (`libs/utils/website/src/tanstack/page-cache.ts`) does three
things on top of the shared core:

1. **Decides what is a document.** GET, `text/html`, not `/api`, `/_serverFn`
   or `/_build`, no dot in the path. The cache key is `pathname + search`.
2. **Fires the background render.** Next's contract was that `get()` returns
   `lastModified: 1` and *Next* schedules the re-render that calls `set()`.
   Nobody does that here, so the adapter serves the stale copy and renders
   again itself. The `startRender` backoff, the shared lock and the grace
   window in `page-cache.js` already assume exactly one re-render per stale
   hit, so supplying that trigger was the whole port.
3. **Stores off the response, not a path list.** A response is stored only if
   its own `cache-control` names an `s-maxage`, is not `no-store`/`private`,
   sets no cookie and is a 200. A 404 is stored as a *deletion*, exactly as
   under Next.

Point 3 is why there is no second path list: `CACHE_RULES` in `src/start.ts`
stays the single source of truth. Mark a route `no-store` there and it stops
being stored here too.

> ⚠ The corollary cuts both ways. A user-specific route that is **missing**
> from `CACHE_RULES` gets the 59s default, and its HTML is then shared between
> visitors. That was already true of the CDN policy; the blast radius is now
> Dragonfly as well.

The CDN policy from `src/start.ts` is unchanged and still does the outer layer
of the job — the page cache is the origin-side tier behind it:

| Path | `cache-control` |
| --- | --- |
| everything else | `public, max-age=59, s-maxage=60, stale-while-revalidate=604800, stale-if-error=86400` |
| any 4xx/5xx | `no-store` |
| `/profile*`, `/login`, `/signup`, `/search`, `/_serverFn/*` | `no-store` |
| `/_build/*` | `public, max-age=31536000, immutable` |
| `/sitemap.xml` | `s-maxage=599, stale-while-revalidate=604800, …` |
| `/rss.xml`, `/atom.xml`, `/feed.json` | `public, max-age=599, s-maxage=599, stale-if-error=86400` |

**If you add a route, add it to `CACHE_RULES`.**

> ⚠ Static files in `public/` are served by nitro *before* the middleware, so
> they get neither these headers nor the page cache. Low impact (only
> `robots.txt` and `favicon.ico`), but worth knowing.

#### Turning it on

It is a no-op — pod-local LRU only, no Dragonfly — unless all three are set:

| Variable | Why |
| --- | --- |
| `REDIS_URL` | Dragonfly. `rediss://` is required in production, with `NODE_EXTRA_CA_CERTS` pointing at the internal CA. |
| `REDIS_KEY_PREFIX` | the medium's ACL prefix; without it the store refuses to share |
| `APP_RELEASE_ID` | scopes every key to one build, so a deploy never serves the previous build's HTML against new asset URLs. This is the Start equivalent of Next's `BUILD_ID` file. |

Prerendering (`PRERENDER=1`) deliberately bypasses the shared store: those
renders are build artefacts, not traffic.

Verify it across two pods, which is the only test that proves the shared tier
rather than the pod-local one:

```bash
podman compose up -d dragonfly
nx build gruppetto
# two pods, same APP_RELEASE_ID, same prefix
PORT=4298 APP_RELEASE_ID=t1 REDIS_KEY_PREFIX=wepublish-local \
  REDIS_URL=redis://wepublish-local:wepublish-local@localhost:6379/0 \
  node dist/apps/gruppetto/.output/server/index.mjs &
# … and the same on 4299. Render on one, then ask the other:
curl -sI -H 'accept: text/html' localhost:4298/mitmachen | grep x-page-cache
```

`x-page-cache: HIT` on the pod that never rendered the page is the proof.
`STALE` means it served the old copy and is re-rendering behind you.

#### What is still missing

`res.revalidate(path)` has no equivalent and `/api/revalidate` is **gone**, not
stubbed. It is not needed: the api bumps `nsv:website:path:<path>` on publish
and every pod notices within two seconds, which is what actually invalidated
pages under Next too. There is no targeted purge endpoint; if a page is ever
visibly stuck, the lever is a CDN purge.

---

## 6. ⚠ Pitfalls

These each cost real time. Read before debugging.

### Pitfall 1: the empty page (`ssrForceFetchDelay`)

**Symptom.** SSR produces a complete HTML shell — styles, fonts, analytics,
`window.WEBSITE_SETTINGS` all correct — but **zero content**. The dehydrated
Apollo payload is also empty.

**Cause.** `createApiClient` passed `ssrForceFetchDelay: 100`. Apollo schedules
`prioritizeCacheValues = false` after that delay **unconditionally, even when
`ssrMode` is true**. With cache prioritisation off, the server-side
`useQuery` no longer downgrades `network-only` to `cache-first`, so it ignores
the cache the loaders just filled and renders nothing.

The pages router got away with it by accident: the Apollo client was
constructed *during* the React render, so the 100 ms timer had barely started.
TanStack builds the client at the start of the request, and the loaders'
network round-trips take longer than 100 ms — so the timer always wins.

**Fix** (`libs/website/api/src/lib/client.tsx`):

```ts
ssrForceFetchDelay: typeof window === 'undefined' ? 0 : 100,
```

With `ssrMode: true`, `prioritizeCacheValues` is already `true` and no timer
is needed. `WepublishApolloProvider` re-asserts it during render as a belt-and-braces
guard.

This was a latent bug in the Next apps too — any slowdown that pushed render
past 100 ms would have emptied their pages as well.

### Pitfall 2: emotion/MUI resolved twice → `theme.spacing is not a function`

**Symptom.** `vite dev` 500s with `TypeError: theme.spacing is not a function`.
The production build is fine, which makes it look like a dev-only fluke.

**Cause.** Vite externalises `node_modules` for dev SSR. MUI's styled engine
gets the **CJS** build of `@emotion/react` while the app's `@emotion/styled`
gets the ESM build — two ThemeContexts, so every styled component renders with
an empty theme. This is the same hazard the Next config works around with
`transpilePackages`.

**Fix.** `ssr.noExternal` them, and spell out the resolve conditions:

```ts
ssr: {
  resolve: {
    // Vite inlines noExternal deps WITHOUT CommonJS interop, so a package
    // whose exports map lands on *.cjs.js dies with "exports is not defined".
    // Emotion's map offers `module` (ESM) before `default` (CJS).
    conditions: ['module', 'node', 'development|production'],
    externalConditions: ['node'],
  },
  noExternal: [
    '@emotion/react', '@emotion/styled', '@emotion/cache',
    '@mui/material', '@mui/system', '@mui/styled-engine',
    'react-tweet', '@mui/x-date-pickers', 'lodash',
  ],
},
```

`resolve.dedupe` alone does **not** help — it does not apply to externalised
SSR dependencies.

### Pitfall 3: the Vite config must be `.mts`

`@tanstack/react-start/plugin/vite` is ESM-only. With a plain `vite.config.ts`
in a CommonJS package you get:

```
Failed to resolve "@tanstack/react-start/plugin/vite". This package is ESM only
but it was tried to load by `require`.
```

Rename to `vite.config.mts` and replace `__dirname` with
`dirname(fileURLToPath(import.meta.url))`.

### Pitfall 4: build-time vs runtime environment variables

Next's `next.config.js#env` inlined `API_URL` & friends at **build time**,
which means one image per environment. Don't carry that over.

- The **server** reads its real `process.env` — never `define` anything in the
  SSR environment, or runtime configuration silently stops working.
- The **client** gets the values at runtime: the root shell writes
  `window.PUBLIC_ENV`, and Vite rewrites every client-side `process.env.X` into
  `globalThis.PUBLIC_ENV.X`:

```ts
environments: { client: { define: clientDefine } }
// clientDefine: { 'process.env.API_URL': 'globalThis.PUBLIC_ENV.API_URL', … }
```

Two traps here:

- esbuild only accepts a **JS literal or a dotted entity name** as a `define`
  value. `(globalThis.X?.Y ?? '')` is rejected with *"Invalid define value"* —
  hence the bare global, and hence the inline `<head>` script that must always
  define it.
- Never `define: { 'process.env': … }` wholesale: that breaks every
  `process.env.FOO` read inside `node_modules`.

Verified: the built client bundle contains no baked API URL, and setting
`APP_ENVIRONMENT=review` at runtime flips the `absoluteUrlToRelative` Apollo
policy without a rebuild.

Also: Nx's Next executor used to load `.env.local` into `process.env`. Nothing
does that for Vite, so `vite.config.mts` does it by hand with
`loadEnv(mode, dir, '')` (empty prefix = read every key, not just `VITE_*`).

### Pitfall 5: `<title>` is not deduplicated

`next/head` merged by `key` and the **last** `<title>` won. React 19 hoists
metadata but keeps every tag, and the browser uses the **first** in document
order.

**Rule:** the shell must never render a default `<title>`. Either a route's
`head()` sets it (for routes with no SEO component: `/signup`, `/mitmachen`,
`/profile`), or `PageSEO`/`ArticleSEO`/`EventSEO`/`TagSEO` renders it — never
both.

The `Head` shim itself is just a fragment; React 19 does the hoisting.

### Pitfall 6: server routes cannot come from a factory

The Vite plugin strips the client bundle by deleting the **literal**
`server: { handlers: { … } }` property from the `createFileRoute` call. If the
options come back from a function call, the plugin cannot see that property,
nothing is stripped, and the server-only imports behind it get pulled into the
browser build:

```
"Readable" is not exported by "__vite-browser-external",
imported by "@tanstack/router-core/dist/esm/ssr/transformStreamWithRouter.js"
```

So page routes may use factories, but server routes must spell the block out
and call a shared *handler*:

```ts
export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => sitemapHandler(getSitemap, getSiteUrl) } },
});
```

Everything referenced inside the handler is then tree-shaken out of the client
bundle along with it.

### Pitfall 7: Nx forbids mixing static and dynamic imports of one library

`@wepublish/utils/website/tanstack` and `…/tanstack/server` are the same Nx
project (`utils-website`). Importing one statically and the other with
`await import()` trips:

> Static imports of lazy-loaded libraries are forbidden

Pick one style. We use static imports everywhere and rely on the TanStack
compiler to strip server-function bodies.

### Pitfall 8: zod `.default()` in `validateSearch` causes a redirect

TanStack canonicalises the URL against `validateSearch` output and 307-redirects
when they differ. A `.default()` therefore rewrites `/event` to
`/event?upcomingOnly=true` and `/search?q=x` to `/search?q=x&page=1` on every
cold load — an extra round trip and split SEO that Next never had.

Keep `validateSearch` schemas free of defaults and apply them when reading
(`upcomingOnly ?? true`). `search-page.tsx` keeps two schemas for exactly this
reason.

Related: search params arrive as **strings** on a cold load and as real values
after a client navigation, so schemas need `z.coerce` / string-or-value unions.

### Pitfall 9: rendering a 404 page does not produce a 404 status

TanStack derives the SSR status from a thrown `notFound()`, not from which
component rendered. The splat route initially returned the 404 page with a
**200**. Always:

```ts
loader: async ({ context }) => {
  await prefetchFourOhFour(context.apolloClient);
  throw notFound();
},
notFoundComponent: FourOhFourPage,
```

The prefetch matters too: the 404 body is CMS content (`page(slug: "404")`), so
without it the not-found component server-renders empty.

### Pitfall 10: `i18n-iso-countries` breaks the bundled server

**Symptom.** The built server starts, then every request 500s with
`Could not dynamically require "./langs/br.json"`.

**Cause.** `i18n-iso-countries` (via `@wepublish/user`) does
`require('./langs/' + code + '.json')` at module init. Rollup cannot follow
that. Note it is bundled by the **Vite SSR** build, not nitro, so a nitro-level
`externals` entry does not help.

**Fix.** `ssr.external: ['i18n-iso-countries']` in `vite.config.mts`.

### Pitfall 11: one emotion cache per request

`createEmotionCache()` must be created **per render** on the server. A shared
cache considers rules already `inserted`, so the second request ships HTML with
no styles at all. `useState(() => createEmotionCache(...))` gives exactly the
right lifetime: new per server render, once in the browser (where `createCache`
also adopts the SSR `<style data-emotion>` tags so hydration does not duplicate
them).

No `@emotion/server` extraction is needed — Emotion 11 emits inline
`<style data-emotion>` elements during SSR, which works with streaming.

### Pitfall 12: heap exhaustion during the build

`vite build` OOMs in the nitro bundling step on a workspace this size. The
build command sets `NODE_OPTIONS=--max-old-space-size=8192`; the Dockerfile
stage does too.

### Pitfall 13: smaller things

- **SVG imports.** Vite returns a URL string; Next returned
  `{ src, width, height }`. `url(${background})`, not `background.src`.
- **`:nth-child`** in emotion SSR warns; use `:nth-of-type`.
- **Stale `dist/`** in the project directory gets linted (thousands of errors
  from minified JS). Keep `dist` in both `.gitignore` and the eslint `ignores`.
- **`vite-tsconfig-paths`** walks `dist/` and chokes on stale generated
  tsconfigs. Pin it: `projects: [join(workspaceRoot, 'tsconfig.base.json')]`.
- **`lodash`** is CJS; `import { escape } from 'lodash'` fails in Vite's dev
  SSR runner. It is in `ssr.noExternal`.

### Pitfall 14: the page cache is CommonJS and its redis client is ESM

Wiring `withPageCache` into `src/server.ts` costs **two** entries in
`build.commonjsOptions`, and both fail in ways that do not look like a build
problem.

**1. The page cache core is CommonJS source.**
`libs/utils/website/src/lib/page-cache/*.js` is plain CJS on purpose: Next
`require()`s `page-cache-handler.js` at runtime from that source path, via
`next.config.js#cacheHandler`, outside any bundler. Vite only runs the CJS
interop over `node_modules`, so importing it from TypeScript dies at build
time with:

```
"createSharedStore" is not exported by ".../page-cache/shared-store.js"
```

Note that `vitest` has no such problem — it transforms the file fine, so the
unit tests pass and only `nx build` fails. Fix:

```ts
build: {
  commonjsOptions: {
    // `include` replaces the default, so node_modules has to be re-listed.
    include: [/node_modules/, /libs\/utils\/website\/src\/lib\/page-cache\//],
  },
},
```

**2. `@keyv/redis` is an ESM-only package required from that CommonJS.**
`shared-store.js` does `require('@keyv/redis').createClient`. Rollup assumes
every *external* is CommonJS and emits `import require$$1 from '@keyv/redis'`
— the default export, which is the `KeyvRedis` class. `createClient` is a
**named** export, so it is `undefined`.

This one does not fail the build. It fails at runtime, once per request, and
the page cache degrades to pod-local with a line in the log:

```
[page-cache] Dragonfly unavailable, caching pages on this pod only …:
require$$1.createClient is not a function
```

Which means: unless you check, it looks like it works. Fix:

```ts
esmExternals: ['@keyv/redis'],
requireReturnsDefault: (id: string) =>
  id === '@keyv/redis' ? 'namespace' : false,
```

Confirm by grepping the output — `import * as redis from "@keyv/redis"` is
right, `import require$$1 from "@keyv/redis"` is wrong:

```bash
grep -n 'keyv/redis' dist/apps/gruppetto/.output/server/chunks/build/server.mjs
```

`@keyv/redis` also has to be in `ssr.external` and nitro's `externals.external`
— it reaches a native `.node` binary through `@node-rs/xxhash`, which rollup
cannot parse at all. Same treatment as `i18n-iso-countries`
([Pitfall 10](#pitfall-10-i18n-iso-countries-breaks-the-bundled-server)).

---

## 7. Deployment

The Next website stage in the `Dockerfile` is Next-specific
(`.next/standalone`, `server.js`). TanStack Start has its own stages:

```
build-website-tanstack  →  website-tanstack-setup  →  website-tanstack
```

The nitro output is **self-contained**: `dist/apps/<app>/.output/` holds the
server bundle, its traced `node_modules` and the static assets nitro serves
itself. No workspace `node_modules` in the runtime image.

`startup-config.json` points at `/wepublish/.output/server/index.mjs`, so
`map-secrets.js restore --start` works unchanged.

CI picks the target automatically in
`.github/workflows/on-demand-publish-docker-image-website.yml`:

```bash
if [ -f "apps/${{ inputs.website_project }}/vite.config.mts" ]; then
  echo "WEBSITE_TARGET=website-tanstack" >> $GITHUB_ENV
else
  echo "WEBSITE_TARGET=website" >> $GITHUB_ENV
fi
```

No caller workflow changes; migrating the next tenant needs no CI edit at all.

The helm chart is unchanged: the container still listens on `PORT` and still
answers `/api/health`. The page cache needs `REDIS_URL`, `REDIS_KEY_PREFIX`
and `APP_RELEASE_ID` in `website.env` — the same three the Next tenants
already get, with `APP_RELEASE_ID` standing in for Next's `BUILD_ID`.

---

## 8. Verification checklist

```bash
# build, typecheck, lint, test
npx nx run gruppetto:build
npx nx run gruppetto:typecheck
npx nx run-many -t lint test -p gruppetto utils-website

# dev server
API_URL=https://api-<tenant>.wepublish.works npx nx run gruppetto:serve

# production server (same artefact, runtime config)
API_URL=... APP_ENVIRONMENT=review PORT=4202 \
  node dist/apps/gruppetto/.output/server/index.mjs
```

Then check, with the server running:

- [ ] every route in the [mapping table](#4-route-mapping-table) returns the
      expected status
- [ ] unknown slugs return **404**, not 200, and render the CMS 404 page
- [ ] `/abo` → 307 `/mitmachen`; `/profile/subscription` → 308 `/profile`
- [ ] `/api/{sitemap,rss-feed,atom-feed,json-feed}` → 301 to the new paths
- [ ] no spurious redirects from `validateSearch` defaults (`/event`,
      `/search?q=x` must stay put)
- [ ] `cache-control` matches the table in [§5](#5-ssr-ssg-and-isr--what-you-really-get)
- [ ] the page cache shares across pods: with `REDIS_URL`,
      `REDIS_KEY_PREFIX` and `APP_RELEASE_ID` set the same way on two
      instances, a path rendered on one answers `x-page-cache: HIT` on the
      other's **first** request (see
      [§5](#turning-it-on)) — and the log has no
      `[page-cache] Dragonfly unavailable` line
- [ ] the HTML contains real content with JS disabled (SSR), including
      `<style data-emotion>` tags
- [ ] no server code in the client bundle:
      `grep -l "node:async_hooks\|createAuthenticatedSsrClient" dist/apps/<app>/.output/public/assets/*.js`
      (an `API_URL_INTERNAL` *identifier* in a dead branch of `getApiUrl` is
      expected and harmless)
- [ ] no baked API URL in the client bundle
- [ ] browser console has **zero** errors/warnings on load (hydration)
- [ ] client-side navigation does not full-reload
      (`performance.getEntriesByType('navigation').length === 1`)
- [ ] `<title>` updates on navigation and is not duplicated

---

## 9. Open questions / things to double-check

Honest list of what is **not** done or not verified.

### Not implemented

1. **Sentry.** `@sentry/nextjs` is gone and nothing replaced it. The app has no
   error reporting, no source-map upload and no tracing. Needs
   `@sentry/react` (browser) + `@sentry/node` (nitro server) and a rewrite of
   `libs/utils/sentry/instrumentation*.ts`, which is currently
   `@sentry/nextjs`-only. The Dockerfile stage still accepts and forwards the
   `SENTRY_*` build args, so the plumbing is there — only the SDK wiring is
   missing. **This should block a production cutover.**

2. **On-demand revalidation.** `/api/revalidate` is gone and nothing replaced
   it. The origin page cache invalidates itself from the api's namespace
   versions within two seconds of a publish, so the remaining delay is the CDN
   window, not the origin. If that is unacceptable, wire the publish webhook to
   the CDN's purge API.

### Not verified (no way to test here)

3. **The Docker image.** The new stages are written but never built — the base
   images (`dhi.io/node:22-debian13-dev`) were not pullable in this
   environment. Specifically unverified: that nitro's traced
   `.output/server/node_modules` includes `i18n-iso-countries` (the one package
   we deliberately externalised), and that the non-root user (1001) can read
   everything after `chmod -R g=u`.

4. **The CI target switch.** The shell detection is straightforward but has not
   run in Actions.

5. **Review apps.** `APP_ENVIRONMENT=review` works locally. The review
   deployment flow passes it as a *build* arg in the Next world; confirm it is
   also present as a **runtime** env var, since that is where it is read now.

6. **Prerendering.** `PRERENDER=1` is wired but never exercised against a real
   API. If you enable it, check that prerendered pages do not freeze
   `window.PUBLIC_ENV` with build-time values.

### Deliberate behaviour differences

7. **List pages are now fully server rendered.** Next prefetched only page 1
   and fetched the rest client-side; every page is now rendered on the server.
   Better for SEO, slightly more origin work.

8. **`prefetch` semantics.** `next/link` prefetched when a link entered the
   viewport. TanStack's closest equivalent is `preload="intent"` (hover/focus).
   Expect different prefetch traffic; `LinkContext.prefetch` still toggles it,
   and it is forced off outside production exactly as before.

9. **`/api/health` kept its path** even though the feeds moved, because it is
   the k8s probe target shared by all 20 websites.

10. **Static assets bypass the cache middleware** (see the note at the end of
    [§5](#5-ssr-ssg-and-isr--what-you-really-get)).

### Worth a second opinion

11. **Anonymous SSR Apollo client.** Public pages render with an anonymous
    client so the HTML stays CDN-cacheable; only `/profile*`, `/login` and
    `/mitmachen` use an authenticated server function. That matches what Next
    did (`getStaticProps` was anonymous, `getInitialProps` was not), but it is
    worth confirming no public page is expected to vary by user — paywalled
    article teasers in particular.

12. **`nitro@3.0.0`** was released very recently. It works, but it is the
    youngest dependency in the stack.

13. **`libs/website/api` `ssrForceFetchDelay` change** affects all 20 Next apps.
    It should only ever help (it cannot disable cache prioritisation earlier
    than before), but it is a shared-library behaviour change and deserves a
    look on one Next tenant before release.
