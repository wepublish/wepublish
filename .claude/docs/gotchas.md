# Gotchas & Load-Bearing Constraints

Things in this repo that look like tidy-up opportunities but are not. Each entry
records **what breaks**, **why the obvious alternative fails**, and **what pins
it**. Read this before "simplifying" config, barrel files, or lint rules.

If you hit a subtle failure that cost you real debugging time, add an entry using
the template at the bottom. A constraint that only lives in one person's head
gets refactored away by the next agent.

---

### ⚠️ Prisma helpers are deliberately absent from the `@wepublish/testing` barrel

[libs/testing/src/index.ts](../../libs/testing/src/index.ts) exports `act-wait`,
`mock-date` and `create-mock` — but **not** the Prisma
utilities, with the reason stated inline:

> Prisma utilities (`createPrismaClient`, `clearDatabase`, `clearFullDatabase`)
> are NOT re-exported here to avoid pulling `@prisma/client` into frontend tests.

Import them from the subpath instead:

```ts
import { createPrismaClient, clearDatabase } from '@wepublish/testing/prisma';
```

**Load-bearing.** Adding them to the barrel drags `@prisma/client` into every
website and editor test bundle. Do not "complete" the barrel file.

---

### ⚠️ NestJS runs on Vitest, but only with `nest: true`

Jest is fully removed — every project runs Vitest. NestJS projects must build
their config with `createVitestConfig({nest: true, environment: 'node', react:
false})`, which swaps esbuild for `unplugin-swc` (`decoratorMetadata`,
`legacyDecorator`, target **es2021**, `useDefineForClassFields: false`). Without
it Nest DI gets no `design:paramtypes` and injected constructor params resolve
to `undefined`; with a native es2022 target, class fields like
`private readonly x = this.injectedParam.y` break instead.

Conversion traps that still bite when writing Nest specs: arrow-function mock
implementations cannot be `new`-ed (use `function`), `vi.mock('mod')` does not
automock class methods (write an explicit factory), partial mocks need
`async importOriginal => ({...await importOriginal(), ...})`, and
`vi.importActual` must be awaited.

See [testing.md](testing.md).

---

### ⚠️ `vitest.config.ts` files are exempt from module boundaries — on purpose

[eslint.config.mjs](../../eslint.config.mjs) turns `@nx/enforce-module-boundaries`
**off** for `**/vitest.config.ts`, because:

> The per-project vitest configs share their setup through the root-level
> `vitest.shared.ts`, which is not part of any project and therefore has to be
> imported by a relative path.

`vitest.shared.ts` in turn re-reads `tsconfig.base.json` and rebuilds the
`@wepublish/*` aliases itself, so _"imports resolve to their source files instead
of built output"_.

**Load-bearing.** Removing the exemption makes every `vitest.config.ts` fail
lint; "fixing" the relative import to an alias breaks resolution, because the
file it points at belongs to no Nx project.

---

### ⚠️ Two ESLint rules are pinned to a pre-upgrade baseline

In [eslint.config.mjs](../../eslint.config.mjs), several rules are deliberately
relaxed with the reason written next to them:

- `@typescript-eslint/no-unused-vars` sets `caughtErrors: 'none'` — typescript-eslint
  v8 changed the default to `'all'`; this pins the previous behaviour.
- `no-constant-binary-expression`, `@typescript-eslint/no-empty-object-type` and
  `@typescript-eslint/no-unsafe-function-type` are `off` — newly enabled by the
  ESLint v9 / typescript-eslint v8 presets, and **not** enforced before the upgrade.
- `@stylistic/no-extra-semi` replaces the removed `@typescript-eslint/no-extra-semi`.

**These are a deliberate baseline, not neglect.** Turning one on is a repo-wide
cleanup task with its own PR — not something to flip while doing unrelated work.

---

### ⚠️ `no-restricted-imports` blocks two imports that otherwise look correct

[eslint.config.mjs](../../eslint.config.mjs) errors on:

- `styled` from `@mui/material` → _"Please import `styled` from `@emotion/styled`
  instead."_ Mixing the two produces components that ignore the Emotion theme.
- `SensitiveDataUser` from `@wepublish/user/api` → import it **only** when the
  sensitive fields are genuinely required; otherwise use `User`.

The second is a data-exposure guard, not a style preference. If you need
`SensitiveDataUser`, be able to say which field forced it.

---

### ⚠️ Four apps are excluded from the typecheck CI job

`website-typecheck.yml` runs the Nx `typecheck` target of every app that has
one. `api-example`, `media` and `bka` have no such target, and `editor` (whose
target checks its own `tsconfig.app.json`/`tsconfig.server.json`) is passed to
`--exclude`. They do not currently typecheck cleanly against the website setup.
No Nx plugin infers this target here (`@nx/vite` only does it for projects with
a `vite.config.*`), so each website app declares it in its `project.json`. A new
app needs one too, or CI silently skips it.

Two failure modes to avoid:

1. Do not "fix" the exclusion as a side quest — those apps fail for unrelated
   pre-existing reasons.
2. Do not drop an app's `typecheck` target to get CI green. If an app you
   touched stops typechecking, fix the app.

---

### ⚠️ `schema-v2.graphql` is generated, and only outside production

`apps/api-example/src/nestapp/app.module.ts` sets `autoSchemaFile` to
`'./apps/api-example/schema-v2.graphql'` **only when `NODE_ENV !== 'production'`**
(in production it is `true`, i.e. in-memory). The file is therefore refreshed by
running the API in dev — never by hand.

If codegen produces stale types, the fix is to **start the API** so the SDL is
rewritten, then run `pnpm run generate-api`. Editing the `.graphql` file directly
gets silently overwritten on the next dev boot. See
[graphql-prisma.md](graphql-prisma.md).

---

### ⚠️ Vitest forces `TZ=UTC`, so local-time bugs pass every test

[vitest.setup-tests.ts](../../vitest.setup-tests.ts) sets `process.env['TZ'] = 'UTC'`
before anything else, and also silences one specific React `act(...)` warning.

A test that passes locally in `Europe/Zurich` but relies on local time will
behave differently under Vitest. Assert on explicit UTC instants, or freeze time
(`vi.setSystemTime` with `vi.useFakeTimers({ toFake: ['Date'] })`) rather than
depending on the ambient zone. Specs carried over from Jest fail with
`jest is not defined` — use `vi.*`.

To test a real zone, set `TZ` on the host process (`runInThisContext('process.env')`
from `vm`) in `beforeAll` and restore it in `afterAll`, as
[periodic-job.timezone.spec.ts](../../libs/membership/api/src/lib/periodic-job/periodic-job.timezone.spec.ts)
does. That spec pins the periodic job's `@db.Date` handling: a local midnight
written to a `date` column lands on the previous day outside UTC (verified
2026-10-06 in CEST: catch-up runs died on the unique `date`, retries found no
row). `toDbDate`/`fromDbDate` in `periodic-job.service.ts` convert at the
database boundary.

---

### ⚠️ `i18next-icu` is imported from `i18next-icu/cjs` — the main entry breaks server rendering

Its ES build default-imports `intl-messageformat`, a CommonJS package without
ESM exports. Node (the Next server, and Vitest for anything not inlined) hands
that import the module object, every message fails to format, and the server
renders raw templates (`{type, select, …}`) that hydration then flips. The
browser bundle resolves fine, so it shows only as hydration errors.
[i18n-formatter.tsx](../../libs/utils/website/src/lib/i18n-formatter.tsx)
therefore imports the CommonJS build; `i18next-icu-cjs.d.ts` next to it types
the subpath, which `moduleResolution: node` cannot see. Don't inline
`i18next-icu` in Vitest again: its spec has to run the package the way Node
loads it.

---

### ⚠️ CI runs one Vitest worker per project — `maxWorkers: 1` is load-bearing

The `ci` configuration in [nx.json](../../nx.json) sets `maxWorkers: 1`.
`test-backend` runs 10 Nx tasks at once on a 4-vCPU GitHub runner, and without
the cap every task started its own pool of ~3 workers. With ~30 processes on 4
cores and coverage on, a test was ~30× slower than locally, and MUI specs around
0.7 s hit the 15 s `testTimeout` (`ui-editor`, 2026-10-16). Don't raise
`testTimeout` or drop the cap to "speed CI up". Make a slow spec cheaper instead.
Each uncached run (all 92 tasks) took ~11 min with the cap and 9 m 04 s
without it, but the run without it failed. Two workers were tried and gave
nothing: 11 m 24 s, and `membership-editor` timed out again (2026-10-16, one
run each).
In happy-dom the cost is mostly `getComputedStyle`, which MUI's Popper and
`TextareaAutosize` call on every open or render.

Local runs don't use `-c ci`. When reproducing CI locally with `-c ci`, add
`--maxWorkers=4` to get your cores back.

---

### ⚠️ A spec must listen on `127.0.0.1` before `supertest` touches the server

On a server that is not listening, supertest calls `listen(0)` per request,
which binds the IPv6 wildcard `[::]`. macOS hands that bind a port another
process already holds on `127.0.0.1` (VS Code's extension host keeps ~160 such
listeners; libuv sets `SO_REUSEADDR` and the kernel only checks same-address
binds). The request then goes to that process, which never answers, and a
random test hits the 15 s `testTimeout` — `membership-api`, about 1 request in
30, reproduced with plain express + supertest, no Nest and no load
(2026-10-26). A bind to `127.0.0.1` cannot collide, but a `listen` with a host
is asynchronous, so the spec has to do it before the first request:
`await app.listen(0, '127.0.0.1')` instead of `app.init()`, closed in the
matching `after*` hook. `vitest.setup-nest.ts` makes supertest throw on a server
that is not listening, so the old form cannot creep back.

---

### ⚠️ Every Dragonfly key must start with `REDIS_KEY_PREFIX`

All media share database 0; a medium's user may only touch `<prefix>:*` /
`{<prefix>}:*` — anything else is `NOPERM`. `-@dangerous` is not enough:
`CLIENT PAUSE`/`KILL`, `DFLY`, `SCRIPT FLUSH`, `SCAN`/`RANDOMKEY` reach other
media, hence `-@admin -client -script -function -memory -pubsub -scan -randomkey
-dbsize` (verified on v2.0.0, 2026-10-01).

**Load-bearing:** `docker/dragonfly/users.acl` must match `redisacl_user` in
`application-configuration` (`modules/wepublish_app/dragonfly.tf`). The command
allowlist tests in `redis-dragonfly-connection.spec.ts` and `shared-store.spec.ts`
pin that our code only sends `GET`/`MGET`/`SET`/`INCR`/`PEXPIRE`/`DEL`/`PING`
under the prefix; a new command needs a look at the ACL first.

---

### ⚠️ Caches are `KvCacheModule.forFeature` profiles; only listed namespaces leave the process

Each cache is a `CacheModule.registerAsync` profile over one `TieredKeyvStore`.
Never use cache-manager's `stores: [...]` tiering, `wrap`, `clear` or
`nonBlocking` (see the cache-manager entry; `no-wrap.spec.ts`), and never
export `CACHE_MANAGER` (events-import registers its own). The store strips
`expires` before handing a value to Keyv, so Keyv never sends `DEL` for an
expired one (`keyv-contract.spec.ts`); `keyv` and `cache-manager` are pinned
exactly in the catalog because of it. Shared values are `val:…` keys; bump the
prefix whenever the payload format changes, or pods of two releases misread
each other. The API's shared namespaces are composed in
`apps/api-example/src/nestapp/shared-namespaces.ts`; `settings:*` throws at
boot (`shared-namespaces.spec.ts`). Values are JSON even in memory:
`Date`s and Prisma `Decimal`s survive, `BigInt`/`Map` do not. See the
[lib README](../../libs/kv-ttl-cache/api/README.md).

---

### ⚠️ A new write path must clear the cache it changes

Sessions, page data, articles, pages, authors, images, polls, readers'
comments and anonymous GraphQL answers are cached for 5 min — for logged-in
requests too. Writers call `NamespaceResets.reset(...)`,
`SessionCacheInvalidator` (user, role, session, peer token) or
`PublicContentCacheInvalidator` from `@wepublish/public-content-cache/api`
(`invalidate` for public changes, `invalidateDraft` for drafts,
`invalidateComments`); otherwise stale data shows until the TTL ends, in the
editor as well. Website pages rebuild only through `WebsiteResetListener`, so
`PublicContentCacheModule` must stay imported by the API root, or resets
silently stop rebuilding them (`app.module.boot.spec.ts`). See the
[public-content-cache README](../../libs/public-content-cache/api/README.md).

Pinned by the `*session-cache*`, `*.cache.spec.ts` and `*content-cache*` specs;
a new write path needs its own test.

---

### ⚠️ nx loads `.env` into every task, tests included

`.env` sets `REDIS_URL` and nx passes it into tests (verified 2026-10-01), so
`vitest.setup-tests.ts` and `vitest.setup-nest.ts` delete it (along with
`REDIS_KEY_PREFIX`). Pinned by `dragonfly.module.spec.ts`. The built api
loads `.env` too (`ConfigModule.forRoot()`), so to run it without Dragonfly set
`REDIS_URL=` (empty) instead of unsetting it.

---

### ⚠️ BullMQ on our Dragonfly needs three things

Verified with bullmq 6.3.11 on v2.0.0 (2026-10-01): Dragonfly must run with
`--lock_on_hashtags` (else _"script tried accessing undeclared key"_), the
queue `prefix` must be `{<REDIS_KEY_PREFIX>}`, and a node-redis `connection`
must drop `name` in `duplicate()` — the worker's `CLIENT SETNAME` is denied by
`-client`, and Dragonfly cannot allow single subcommands. The flag is not in
`docker-compose.yml`; check dragonfly01 first. Nothing guards this.

---

### ⚠️ The page cache hands Next a fake `lastModified`

`page-cache.js` returns "now" for a fresh page and `1` for a stale one. Next
16.1.7 knows a route's `revalidate` only from the prerender manifest or its own
renders, and assumes **1 s** for every other path — every `fallback: 'blocking'`
article read by a second pod (verified 2026-10-01). The handler is plain
CommonJS (Next `import()`s it unbundled) and is reached via two spellings of
`serverDistDir`, hence `resolve()` in `cacheFor`. Pinned by
`page-cache-handler.spec.ts` (drives Next's real `IncrementalCache`).

---

### ⚠️ Unpublished articles must answer 200, never 404 — the preview needs that page

The editor preview (iframe or window, `?preview`) opens the article's public
URL and only then logs in and fetches the draft in the browser
(`with-jwt-handler.tsx`). A 404 for "no visible version" renders the 404 page
instead, and the preview of every never-published article goes blank
(customers have hit preview regressions repeatedly). Visitors get
[`ContentUnavailable`](../../libs/content/website/src/lib/preview-unavailable/content-unavailable.tsx)
instead: `noindex` plus a note, never shown with `?preview`, admin-bar preview
mode or a login that may preview. The API likewise keeps returning unpublished
articles to anonymous callers (external draft readers).

Pinned by `content-unavailable.spec.tsx` and `preview-unavailable.spec.tsx`;
verified end to end 2026-10-02 (24 browser cases incl. hauptstadt, iframe,
popup, session cookie, `SHOW_PENDING_WHEN_NOT_PUBLISHED`).

---

### ⚠️ The editor's preview iframe cannot keep the session cookie — it needs the sessionStorage copy

[`SessionProvider`](../../libs/utils/website/src/lib/session.provider.tsx)
keeps the website session in the `auth.token` cookie (`SameSite=strict`). In
the editor's in-editor preview the website runs in a **cross-site** iframe
(`editor-<medium>.wepublish.cloud` around e.g. `tsri.ch`), and browsers drop
that cookie there. The JWT handshake then succeeds, but every following request
goes out without a session and the banner says "Du siehst die veröffentlichte
Version" (prod, 2026-10-06; reproduced in Chromium, Firefox and WebKit: cookie
not stored, 0 authenticated API requests). Locally it works, because
`localhost:3000` and `localhost:4204` are the _same site_ — ports do not count.
Reproduce with a host page on `127.0.0.1` around `localhost:4204`.

A framed page therefore also writes the token to `sessionStorage`, which
`authLink` falls back to. Making the cookie `SameSite=None` instead would loosen
it for every page and is partitioned or blocked in some browsers. Writing
`sessionStorage` for _top-level_ pages too breaks logout: it only clears the
browser side, so a per-tab copy would keep other tabs logged in (and in preview
mode) after logging out in one.

**Load-bearing:** the `isFramed()` checks in `session.provider.tsx` and
`hasFramedSession()` in `use-preview-auth-state.ts`, and
`sessionStorage.removeItem` on logout.

Pinned by `session.provider.spec.tsx` and `preview-status-banner.spec.tsx`.

---

### ⚠️ Next never re-renders a stale page for a prefetch, so the page lock expires early

[`page-cache.js`](../../libs/utils/website/src/lib/page-cache/page-cache.js)
gives the pod that takes `page-lock:<build>:<path>` the stale copy so Next
re-renders it, and every other pod the same copy as fresh. Next 16 skips that
re-render for `purpose: prefetch` requests (`response-cache/index.js`), yet the
handler takes the lock for them too. With a prefetch every 5 s after an edit,
both pods served the old article as fresh for 61 s (E2E 2026-10-02). So the lock
stores its start time and other pods only wait 3 s (`RENDER_GRACE_MS`). A pod
that handed out the stale copy then serves it as fresh for 30 s unless the
render stored the page (`RENDER_BACKOFF_MS`; Next's own error backoff needs the
route's `cacheControl`, which only the rendering process knows) — but not after
a prefetch, which the handler reads from `ctx._requestHeaders.purpose` (Next
builds one handler per request).

**Load-bearing:** the timestamp in `acquireLock`, the `lockedSince` check and
the prefetch exception around `startRender`; "the lock owner always renders" is
not true. Pinned by `page-cache.spec.ts` and `page-cache-handler.spec.ts`.

---

### ⚠️ 404s and 5xx are `no-store` only through a `writeHead` patch

`next.config.js` sends `s-maxage=59` for `/:path*` and Next never replaces a
`Cache-Control` already set (`pages-handler.js`); without it Next still sends
`s-maxage=1` for `notFound`, and a 500 (api down while a page renders for the
first time) went out as `public, s-maxage=59` (verified end-to-end 2026-10-02).
`register()` in `libs/utils/website/src/next/sentry/instrumentation.ts` makes
every 404 and 5xx `private, no-store, max-age=0` (`error-no-store.ts`, same
folder) so Cloudflare never keeps one. Pinned by `error-no-store.spec.ts`;
nothing checks the wiring in CI (verified end-to-end 2026-10-01).

---

### ⚠️ A missing article is not always a 404: `revalidateFor` tells it from a failing api

`article(slug)` for a never-published article answers `Cannot return null for
non-nullable field ArticleRevision.id` (or `Article.latest`), code
`INTERNAL_SERVER_ERROR` without `status` — exactly like a Prisma pool timeout —
and the website clients use `errorPolicy: 'all'`. The preview needs that page as
an empty 200 (see above), so `revalidateFor(content, errors)` keeps it 60 s.
Without content it throws on every other error that is not a 4xx
(`extensions.status`, or `extensions.originalError.statusCode` for 400/401/403/422),
so Next keeps the previous page instead of storing an empty one for every pod —
except during `next build` (`NEXT_PHASE`), which prerenders `index.tsx`.

**Load-bearing:** `HIDDEN_CONTENT` in `revalidate-for.ts` — without it the first
view of an unpublished article (the editor preview) is a 500 and an unpublished
article stays served stale — and the `, article.errors` / `, page.errors`
argument in every app. Pinned by `revalidate-for.spec.ts` (shapes checked against
`@nestjs/apollo` 13.2 and the real SDL, 2026-10-02); nothing checks that an app
passes `errors`.

---

### ⚠️ Never let `@redis/client` resolve below 6.3.0

`class VerbatimString extends String` puts `String.prototype` into V8 dictionary
mode, and V8 never makes it fast again on its own. 6.3.0 fixes it in
`verbatim-string.js` (`Object.create(String.prototype)` store); 5.x and 6.0–6.2
do not. Benchmark with 5.12.1, Node 22.23, 2026-10-24:

| Workload | Not loaded | Loaded |
| --- | --- | --- |
| Website: Next ETag hash over a ~150 KB page | 2030 ops/s | 640 (32 %) |
| String methods (`toLowerCase`, `split`, `replace`, …) | 18870 | 13560 (72 %) |
| API: sha256 key + JSON round trip of an article | 1850 | 1820 (98 %) |

Nothing guards this — a regression here is silent. Any package that brings its
own older copy re-slows the process as soon as it loads.

v6 defaults both clients override: `RESP: 2` (no `HELLO 3` against the ACL),
`maintNotifications: 'disabled'`, `commandOptions: { timeout: undefined }`
(its 5 s timeout would beat our own and stop silent sockets from being dropped)
and `socket.keepAliveInitialDelay: 5000`.

### ⚠️ The Sentry packages must move as one, and must stay on 11+

[package.json](../../package.json) keeps `@sentry/nestjs`, `@sentry/nextjs`,
`@sentry/react` and `@sentry/profiling-node` on one major; the ones the api and
media images ship are `catalog:` entries in
[pnpm-workspace.yaml](../../pnpm-workspace.yaml).

**Why 11+.** On 10 the API died on boot: `TypeError: Cannot redefine property:
Cron`. `@nestjs/schedule` 12 is ESM only, so its decorator exports are
non-configurable and shimmer cannot patch them. Sentry 11 dropped that
import-in-the-middle instrumentation (getsentry/sentry-javascript#22805).

**Why together.** `@sentry/profiling-node` pins `@sentry/node` exactly, so a
mixed set installs two `@sentry/node` copies with separate `__SENTRY__`
carriers. Bumping only nestjs + profiling-node did not compile: `Type
'Integration & { name: string; }' is not assignable to type 'Integration'` — a
v11 integration handed to a v10 `Sentry.init`. Nothing type-checks this; bump
all four together.

v11 renames: `beforeSendSpan` gets a streamed span with `attributes`, not
`data`; `profilesSampleRate` became `profileLifecycle` +
`profileSessionSampleRate`; `withSentryConfig` moved to `@sentry/nextjs/config`
— a subpath export node10 `moduleResolution` cannot see, so every app needs
`moduleResolution: bundler`.

**Diagnostics-channel spans need a plain `node` process.** v11 instruments
`express`, `graphql`, `@nestjs/*`, `pg` and Prisma via diagnostics channels
injected by runtime module hooks. Until 2026-10-20 the API shipped as a
`@yao-pkg/pkg` binary, which cannot register them, and booted with _"Failed to
register diagnostics-channel injection hooks, so channel-based integrations
will not record spans."_ It now runs under plain `node`; if that warning comes
back, the cause is something else. Two build-time workarounds failed on
2026-10-05 — do not redo them:

- `sentryOrchestrionWebpackPlugin` (build-time injection) builds clean and
  injects **nothing**: `@nx/webpack` externalizes node_modules, so webpack
  never compiles them. Its externals warning cannot fire either — it inspects
  only string/RegExp/object externals and nx passes a function. Grep the
  bundle for `tracingChannel` rather than trusting a clean build.
- Bundling them instead (`externalDependencies` listing only native/Prisma/pg)
  dies on Nest's dynamic loaders: `Can't resolve 'class-transformer/cjs/storage'`
  plus critical-dependency warnings from `load-package.util.js`,
  `load-adapter.js`, `optional-require.js`.

`enableRuntimeChannelInjection: false` silences the warning without restoring
spans, so it is deliberately unset.

Pinned by [libs/utils/api/src/lib/sentry/instrumentation.spec.ts](../../libs/utils/api/src/lib/sentry/instrumentation.spec.ts),
which guards the options shape but not the versions.

---

### ⚠️ Optional peers the bundle never names

`apps/<app>/package.json` lists what the webpack bundle `require()`s (see
[infrastructure.md](infrastructure.md)). Libraries that resolve an optional
peer at runtime — Nest's `loadPackage` / `loadAdapter`, `ApolloDriver`,
terminus's `import.meta.resolve` + `await import(...)` — never show up there,
so unless the peer is listed too, `pnpm deploy` leaves it out and the image
dies on boot with `No driver (HTTP) has been selected` or _The "<pkg>" package
is missing_. The API lists two such peers: `@as-integrations/express5`
(`@nestjs/apollo`) and `@nestjs/axios` (`@nestjs/terminus`). The HTTP adapter
used to be a third — `@nestjs/core` still declares `@nestjs/platform-express`
as an optional peer and resolves it through `loadAdapter` — but both apps now
pass `new NodeAdapter()` to `NestFactory.create`, so the bundle names
`@nestjs/platform-node` outright. `docker/check-runtime-deps.js` accepts a
listed package the bundle never loads when a loaded package declares it as a
peer (`peerDependencies` or `peerDependenciesMeta`), so they pass the check.

**Before adding a library that lazily resolves an optional peer** — grep it for
`loadPackage`, `assertPackages`, `loadAdapter`, `import.meta.resolve` and
`await import(` — add that peer to the app's `package.json` as well. Nothing
type-checks or tests this; only booting the image shows it.

---

### ⚠️ Root `sideEffects` must list the API's Sentry instrumentation

The root `package.json` marks every repo file side-effect free, so webpack
drops bare imports like `import '@wepublish/utils/api/sentry'` (api-example and
media `instrument.ts`). Dropping it compiles the import to `0;`, and the API
then boots without `Sentry.init`. It started being dropped with the dependency
bump in #3195 (webpack 5.108 → 5.112), and `docker/check-runtime-deps.js` then
failed the image build on the now-unused `@sentry/profiling-node`. The array form keeps
`libs/utils/api/src/lib/sentry/instrumentation.ts` and leaves everything else
tree-shakeable. **A new file loaded only by a bare import needs an entry here
too.**

---

### ⚠️ Tenant request interceptors are `proxy.ts`, never `middleware.ts`

A `middleware.ts` runs on the Edge runtime, and since Next 16.4 (#3195) its
bundle also pulls in our `cacheHandler`
(`libs/utils/website/src/lib/page-cache/page-cache-handler.js`). That brings in
`@redis/client` → `@node-rs/xxhash`, whose browser build needs
the uninstalled `@node-rs/xxhash-wasm32-wasi`, so `nx build <tenant>` fails
with _Module not found_. `proxy.ts` (`export function proxy`) runs on Node and
builds fine; every tenant uses it.

---

### ⚠️ node:http has no `req.res` back-reference

Express assigns `req.res` (and `res.req`) on every request. Raw `node:http`
does not, and `@nestjs/platform-node` does not add it — `NodeRequest` only
extends `IncomingMessage`. Anything reaching the response through the request
silently stops working, and because the call sites were written
`req.res?.setHeader(...)`, the optional chain swallows it: no crash, just
headers that never get sent.

[api-token.strategy.ts](../../libs/api-token/api/src/lib/api-token.strategy.ts)
needs it, since a passport `validate()` gets the request and nothing else.
[responseBackReference](../../libs/api-token/api/src/lib/response-back-reference.ts)
restores the link and api-example installs it in `main.ts` before helmet.

**A unit test cannot catch this** — the existing strategy spec fakes
`{ res: { setHeader } }` and passes either way. Only an HTTP-level test on a
real `NodeAdapter` app shows it, which is what
[response-back-reference.spec.ts](../../libs/api-token/api/src/lib/response-back-reference.spec.ts)
does: one case asserts the link is *absent* without the middleware.

---

### ⚠️ `@nestjs/apollo` refuses the node:http adapter

`ApolloDriver.registerServer()` switches on `httpAdapter.getType()` and handles
exactly `express` and `fastify`. `@nestjs/platform-node` reports `node`, so the
whole API dies on boot with _No support for current HttpAdapter: node_ — the
error comes from `GraphQLModule.onModuleInit`, not from anything we wrote.

[libs/utils/api/src/lib/graphql/node-apollo.driver.ts](../../libs/utils/api/src/lib/graphql/node-apollo.driver.ts)
overrides `registerServer` to call the `protected registerExpress` directly.
That path only needs `getInstance().use(path, handler)` and Express-shaped
`req`/`res`, both of which platform-node provides, so Apollo runs unmodified on
top of it — `@as-integrations/express5` stays a runtime dependency.

**Drop the subclass once Apollo knows the adapter.** It depends on a protected
method, so a `@nestjs/apollo` bump can break it; the failure is loud and caught
by
[app.module.http.spec.ts](../../apps/api-example/src/nestapp/app.module.http.spec.ts).

---

### ⚠️ Express 5 has no bare `*` route

[apps/editor/src/server-app.ts](../../apps/editor/src/server-app.ts) serves
static assets through an unmounted `express.static` and falls through to
`app.use(handleRequest(indexPath))` — neither call names a path.

The express 4 version used `app.get('*.*', …)` for assets and `app.use('*', …)`
for the SPA fallback. Under express 5 the editor host exits before it listens:
`PathError [TypeError]: Missing parameter name at index 1: *.*`.

path-to-regexp 8 requires every wildcard to be named (`/*splat`), and `'*.*'`
has no valid spelling at all — the "has a file extension" test it stood for is
not expressible as a path pattern. Routing by whether the file exists on disk
is, and `express.static` already calls `next()` when it does not.

**Load-bearing:** `index: false` on `express.static`. Without it `/` is served
as a raw `index.html` with the immutable cache header and without the injected
settings blob, so the editor boots with no `API_URL`.

Pinned by [apps/editor/src/server-app.spec.ts](../../apps/editor/src/server-app.spec.ts)

---

### ⚠️ `block-content` injects anything from `article` or `page` through `forwardRef`

`libs/article/api` and `libs/page/api` import `@wepublish/block-content/api`,
and block-content imports them back. Every block-content provider that takes
`ArticleService`, `PageService` or `HOT_AND_TRENDING_DATA_SOURCE` therefore
uses `@Inject(forwardRef(() => …))` — see
[teaser-list.resolver.ts](../../libs/block-content/api/src/lib/teaser/teaser-list.resolver.ts)
and [block-tree-loader.ts](../../libs/block-content/api/src/lib/block-tree/block-tree-loader.ts).

Without it the class or token is still `undefined` when the decorator runs,
and the API dies at boot: `Nest can't resolve dependencies of the
BlockTreeLoader (EventService, ?, BlockTemplateDataloaderService)`. Whether
it dies depends on module load order: until 2026-10-07 the `ActionModule`
happened to import `ArticleModule` early enough to hide two missing
`forwardRef`s; deleting that module exposed both.

**Load-bearing:** the `forwardRef` wrappers. Removing or reordering a module in
`app.module.ts` can make a cycle that "worked" fail at the next start.

Guarded for `BlockTreeLoader` only: `block-tree-loader.spec.ts` starts with
`import './article.service';`, which enters the cycle from the article side and
reproduces the boot error in a unit test. A new injection site needs the same
trick or nothing catches it before `nx serve api-example`.

---

### ⚠️ A service with `@PrimeDataLoader` makes everything that injects it request-scoped

`@PrimeDataLoader(X)` property-injects the request-scoped dataloader `X`, so the
service (e.g. `SettingsService`) and every provider above it in the dependency
tree become request-scoped. Nest then skips their `@Cron`/`@Interval` with only
a startup warning (`Cannot register cron job … non static provider`) and never
calls their `onModuleInit`. On 2026-10-27 `PaymentMethodChangeService` injected
`SettingsService`, and the nightly periodic job silently stopped in every tenant.

Providers with a schedule or lifecycle hook read through Prisma, not through
such a service. Pinned by `app.module.boot.spec.ts` (`keeps every scheduled or
lifecycle-hooked provider out of request scope`), which walks the real module
graph and names each offender; the unit specs mock the dependencies away.

---

### ⚠️ The editor's `refetchOn` config does nothing; a refocus reload is `AuthProvider`

[setup.tsx](../../libs/editor/api/src/lib/setup.tsx) sets
`defaultOptions.watchQuery.refetchOn = {online: false, windowFocus: false}`. It
type-checks and has no effect: Apollo Client 4 only reads `refetchOn` when the
client is built with a `refetchEventManager`, and nothing in this repo
constructs one, so Apollo never refetches on focus in the first place.

What did reload the whole editor on refocus was
[authContext.tsx](../../libs/ui/editor/src/lib/authContext.tsx): it re-checks
the session on every `usePageVisibility()` change and used to render `null`
while `loading`. Apollo Client 4 flipped the `notifyOnNetworkStatusChange`
default from `false` to `true` (verified in `QueryManager.js`, @apollo/client
4.3.1, 2026-10-08), so from AC4 on a `refetch()` sets `loading: true` — the
provider returned `null`, unmounted the editor, and every remounted query
re-ran under the `network-only` default.

**Load-bearing:** `loading && !data` (not `loading`) in the provider's return,
and the `if (!isPageActive) return` guard, which keeps the tab _losing_ focus
from triggering the same round trip.

Pinned by [authContext.spec.tsx](../../libs/ui/editor/src/lib/authContext.spec.tsx).

---

### ⚠️ Startup writes must be race-free: replicas boot at the same time

Several API pods start together (every deploy, a new medium with 2+ pods). A
check-then-write at boot (`findUnique` then `create`) and even Prisma's
`upsert` (it is a read plus an insert unless Prisma can turn it into a native
`ON CONFLICT`) let all but one pod die with P2002 on a fresh database (verified
2026-10-06: `settings.analyticsProvider`, then `settings_name_key`).
`GoogleAnalyticsDbConfig.initDatabaseConfiguration` and
`reconcileProviderRegistry` therefore insert with
`createMany({ skipDuplicates: true })` (`INSERT … ON CONFLICT DO NOTHING`).

Pinned by `google-analytics-db-config.spec.ts` and the "several replicas" cases
in `reconcile-provider-registry.spec.ts`, whose fakes race like Prisma does.

---

### ⚠️ A `MailchimpSyncError` row takes its user out of every Mailchimp sync

The nightly sync skips every user with a row for the config, whatever the
error and however old ([mailchimp-sync.service.ts](../../libs/membership/api/src/lib/mailchimp-sync/mailchimp-sync.service.ts),
`getRecentSyncErrorUserIds` — nothing makes it "recent"). Rows only go away when
someone deletes them in the editor's sync error list.

The email-change hook used to record one whenever Mailchimp refused the rename,
including when the user had signed up with the new email. That user then
dropped out of the sync for good, with two stale contacts (found on hauptstadt,
2026-10-09). Record an error only for a state a person has to resolve, and
handle the expected Mailchimp answers instead.

Mailchimp renames only `subscribed` contacts, and not onto an email that an
active, archived or even permanently deleted contact still has: all give
`400 Invalid Resource`, with the reason only in `errors[].message`, e.g.
`"…" is already in this list with a status of "Deleted".` Removing the
existing contact cannot make room; renaming it away first does, which is why
the hook moves it to `moved-<contact_id>@wepublish.ch` before archiving it
(`example.com` is rejected as invalid). All verified against the hauptstadt
audience on 2026-10-09.

Nothing guards the skip itself — a user missing from the sync shows up only in
that error list.

---

### ⚠️ `@Feature` is a plain guard, not `OneOf` — and `useFeature` starts at false

[feature.decorator.ts](../../libs/features/api/src/lib/feature.decorator.ts)
uses `UseGuards(FeatureGuard)`, unlike `@Permissions`, `@Authenticated` and
`@Settings`, which all add to `OneOf`.

`OneOf` passes when **any** listed guard passes, so a feature check added to it
would be skipped whenever the user has the permission. That is every admin:
`addPredefinedPermissions` gives the admin role all of them. A method-level
`UseGuards` runs after the global guards and adds an AND.

In the editor, `useHasPermission` answers `true` while the roles are loading.
`useFeature` deliberately answers `false` until the `features` query is back,
so an unreleased menu item never flashes in.

**Load-bearing:** the `UseGuards` in `Feature()`, and the `?? false` in
`useFeature`. Wrapping either in the permission pattern opens unreleased
features to every admin, or briefly to everyone.

Pinned by `feature.guard.spec.ts` and `featureContext.spec.tsx`.

---

### ⚠️ A backtick inside a CSS comment ends the Emotion template literal

A `/* … */` comment inside a styled template is still _inside a JavaScript
template literal_, so a backtick in it closes the string. Writing

```
  /* The channel var rather than `alpha()`, so the tint follows the scheme. */
```

inside `styled.span\`…\``produced`TS1005: ',' expected` three lines later
(`userSubscriptionsList.tsx:185`), pointing at code that was perfectly fine —
the parse had already gone off the rails at the backtick.

The obvious alternative — escaping it as `` \` `` — works for the compiler but
puts a stray backslash in the emitted CSS comment. Just write the name without
backticks: `alpha()`, not `` `alpha()` ``.

**Load-bearing:** nothing enforces this; `tsc` reports it as a syntax error in
the wrong place, which is what makes it expensive. Nothing guards this — a
regression here is caught by the build, but the message will mislead you.

---

### ⚠️ A `!` non-null assertion inside a handler can crash the page under the React Compiler

`apps/editor` compiles with `babel-plugin-react-compiler`. The compiler reads
values out of a handler to decide what to memoise, so

```tsx
const [articleToImport, setArticleToImport] = useState<{articleId: string}>()
…
<Button onClick={() => importPeerArticle({
  variables: { articleId: articleToImport!.articleId },
})} />
```

dereferenced `articleToImport` **during render**, while the dialog was closed
and the state was `undefined`. `/articles/peer` rendered a blank editor with
`Cannot read properties of undefined (reading 'articleId')` — and because the
element is built eagerly, it happened even though the dialog had `open={false}`
and the handler had never run.

The obvious alternative — leaving the `!` because "TypeScript is happy and the
handler only runs when it is set" — is exactly the assumption the compiler does
not share. Guard instead:

```tsx
onClick={() => {
  if (!articleToImport) return
  …
}}
```

`@typescript-eslint/no-non-null-assertion` warns on these; under the compiler
the warnings on optional _state_ are worth treating as errors.

**Load-bearing:** `RouteErrorBoundary` in `apps/editor/src/app/app.tsx` is what
makes this class of bug visible at all — without it React unmounts the tree and
Sentry swallows the message, leaving a blank page and an empty console. Pinned
by `routeErrorBoundary.spec.tsx`.

---

### ⚠️ `watch('x')` is read once under the React Compiler — use `useWatch`

react-hook-form's `watch` is a function with a stable identity, so the compiler
memoises the call against it:

```js
// what the compiler emits for `const a = watch('alpha')`
if ($[0] !== watch) {
  t0 = watch('alpha'); // never re-runs: `watch` never changes
  $[0] = watch;
  $[1] = t0;
} else {
  t0 = $[1];
}
```

The field is read on the first render and never again. On screen that is a
member plan whose pricing panel stays on "enable a payment interval first"
after one is enabled, and an analytics toggle whose id field never appears.
Nothing throws, so it reads as a layout bug rather than a stale read.

`useWatch({ control, name })` is a hook: it subscribes, and the compiler leaves
it alone. Every editor read is one (`grep "[^e]watch("` under `apps/editor` and
the editor libs comes back empty). Where a hook cannot go — a `map` over
settings, `bypasses.${index}.token` — subscribe to the parent once with
`useWatch({ control })` or `useWatch({control, name: 'bypasses'})` and index
into the result.

This is also why components taking `watch` were quietly _skipped_ by the
compiler before ("Compilation Skipped: Use of incompatible library"); removing
`watch` lets it compile them, which can surface fresh `set-state-in-effect`
errors in code that was never checked.

---

### ⚠️ The compiler turns a hoisted inner function into a `const`

A function declaration inside a hook callback that another inner function
closes over is emitted as `const clampPoint = function clampPoint(…)`, while
the call site above it stays where it was:

```js
t1 = () => {
  setTransform(point);                    // ← runs first
  const clampPoint = function clampPoint(p) { … };   // ← no longer hoisted
  function setTransform(p) { return clampPoint(p); }
};
```

`libs/ui/editor/src/lib/atoms/draggable.tsx` did exactly this and the image
edit panel died with `Cannot access 'clampPoint' before initialization` — the
focal-point picker, so every image drawer in the editor. Declare helpers above
their first call inside effects; JavaScript's hoisting is not a guarantee once
the compiler has been through.

---

### ⚠️ `useSeededState` compares with `Object.is`, and that is load-bearing

`NaN !== NaN`, so a plain `!==` sees a new value every render and seeds
forever — "Too many re-renders" from inside `CurrencyInput`. An amount derived
from a form whose async `defaultValues` has not resolved (`monthlyAmount *
months` where `monthlyAmount` is still `undefined`) is exactly that. Pinned by
a case in `use-seeded-state.spec.tsx`.

The same render guards the cure: a view with async `defaultValues` should
return nothing until `formState.isLoading` clears.

---

### ⚠️ `DataTable`'s body memo must depend on the columns

`libs/ui/editor/src/lib/listView/data-table.tsx` memoises the rendered rows so
that dragging a column — which updates sizing state on every mousemove — does
not re-render every cell. The deps have to include `columnDefs`: a cell may
draw from something outside its row (a second query's answer), and that reaches
the table as a new `columns` array while `rows` keeps its identity.

Left out, the import-events list never redrew its "imported" buttons when the
ids query landed, which read as a flaky test rather than a bug. A drag is
unaffected by the extra dep, because the sizing state is the table's own and
leaves the caller's `columns` untouched.

---

### ⚠️ A form group has to space itself — the theme gives controls no margin

`MuiFormControl` is `margin: 'none'` in the editor theme (see the comment
there for why dense did not suit). rsuite's `<Form fluid>` spaced its controls
for you, and the codemod turned it into `<Stack sx={{ width: '100%' }}>`,
which does not. With no margin and no gap the fields sit flush and the second
field's floating label lands _on the border of the first_ — visible on the
crowdfunding form, the poll editor, the article metadata panel and the
settings page.

So every form group carries `spacing={3}`, and
`tools/rsuite-to-mui/codemods/form-bare.mjs` and `form-stack.mjs` emit it, so
a re-run does not undo the fix. When a group spaces itself, a child carrying
`sx={{ marginBottom: 3 }}` is the old manual spacing and doubles the gap —
63 of those came out with the fix.

New groups should use `FormFields` from `@wepublish/ui/editor` instead; the
`Stack` form is what the migration left behind.

---

### ⚠️ `CardContent` inside `CardContent` is padding inside padding

The settings page nested three deep (`Card > CardContent > CardContent >
CardHeader + CardContent`), which is 48px of padding before a single control
and a header indented away from its own card's edge. A card is
`CardHeader` + one `CardContent`; anything more is a wrapper someone added to
get spacing that `gap` should provide.

---

### ⚠️ A row tint has to be a background _image_, not a background colour

The list row states (`approved`, `pending-approval`, `rejected`, …) are
7-12% alphas defined in `editorGlobalStyles.tsx`. Painted as
`background-color` on `.MuiTableCell-root`, they beat the pinned column's own
`background-color` on specificity (two classes vs one class and an attribute)
— so the pinned Actions column became translucent and the rows scrolling
underneath showed straight through it on a narrow viewport.

As `background-image: linear-gradient(tint, tint)` the tint layers _over_ the
cell's own background instead of replacing it: a pinned cell keeps its opaque
`background.paper` underneath and comes out the same colour as its neighbours.
Anything else pinned in a tinted row needs the same treatment.

---

### ⚠️ The editor's grids were written for `xl`, which starts at 1536px

The audience dashboard laid its three regions out at `xl` only, so on any
ordinary laptop every one of them fell back to `xs: 12` and the page became a
single tall stack — eight metric toggles one per row across a 1200px card.
`lg` (1200px) is the breakpoint that matches the editor's own layout; check
for `xl:` before concluding a screen is "just badly designed".

A field alone on its row wants the whole row, too: `subscriptionEditView` had
single-child rows at `xs: 6`, which left half the column empty and wrapped
every label.

---

### ⚠️ `useLocalStorage` broadcasts to every hook on the page

`set` in `libs/ui/src/lib/hooks/use-local-storage.ts` ends with
`window.dispatchEvent(new StorageEvent('storage'))` so other hooks sharing the
same key stay in sync. The listener fires for _every_ mounted instance, whatever
key it holds, and each one re-reads its own entry and calls
`setValue(deserialize(item))` — a brand new object for an untouched value.

On the page list that meant hiding a column (a write to
`wepublish:editor:listColumns:pages`) handed `useListViewState('pages')` a new
`filter` identity, which re-ran `useEffect(() => refetch(…), [filter, …])` and
blanked the rows while the query came back. The article list had no such effect,
which is why only one of the two flickered.

**Load-bearing:** the `item === storedRaw.current` early return in the listener.
Without it any `useLocalStorage` write re-renders every other consumer in the
app. The redundant `refetch` effect is gone from `pageList` as well — `useQuery`
already refetches when its variables change.

Pinned by `apps/editor/src/app/routes/pages/pageList.spec.tsx` ("does not
refetch when a column is hidden"), which seeds the stored list state first: with
nothing in storage the hook falls back to a stable default and the bug cannot
reproduce.

---

### ⚠️ Apollo mocks: incomplete data and Apollo 3 matchers

A mocked result that lacks a fragment field (`Missing field 'goodie' while
writing result` in stderr) leaves the normalised object incomplete, and Apollo
refetches with a mock that is already used up. Type mocks with
`satisfies Exact<…Fragment>` (never `as`) or build them with the
`@wepublish/mocks/website` factories, and write "no value" as `null`, not
`undefined`. Treat any `Missing field` line in a spec's stderr as a bug.

The top-level `variableMatcher` of Apollo 3 is silently ignored in Apollo 4:
match any variables with `request: { query, variables: () => true }`
(`anyVariables` in the mocks lib).

---

### ⚠️ `theme.palette` is the light scheme, frozen

The editor builds one theme with both colour schemes and `cssVariables`, so
the live colours live in `theme.vars.palette.*` (which compile to
`var(--mui-palette-…)` and follow `data-mui-color-scheme`). `theme.palette.*`
is whatever the light scheme was at `createTheme` time — it never changes with
the toggle.

A styled component that reads `theme.palette.background.paper` therefore paints
white in dark mode: the dashboard's "Customize dashboard" dialog had white rows
with grey-on-white labels until its five reads were switched to `theme.vars`.
Exceptions are deliberate: `analyticsIntegrationForm` passes
`theme.palette.success.light` through `lighten()` — a colour _function_ cannot
take a CSS variable — and pairs it with an explicit
`[data-mui-color-scheme='dark'] &` branch.

**Load-bearing:** `theme.vars.` in every styled rule that names a palette
colour. A grep for `theme.palette.` outside a dark-mode branch is the check.

Pinned by `apps/editor/src/app/routes/dashboard/dashboardConfig.spec.tsx`,
which reads the _emitted_ rule rather than the computed value — jsdom resolves
`var(--mui-palette-background-paper, #fff)` to the light fallback baked into
it, so `getComputedStyle` cannot tell the two apart.

### ⚠️ The R2 client must bound its sockets

Both `S3Disk`s in [`app.module.ts`](../../apps/media/src/app/app.module.ts) get
`fetch: createStorageFetch()`
([`storage-fetch.ts`](../../libs/media/api/src/lib/storage/storage-fetch.ts)):
undici's `fetch` over an `Agent` with `connections: 50` per origin and a 30 s
`headersTimeout`/`bodyTimeout` (undici's default is 300 s, so one stalled R2
response held a capped socket for five minutes). Connects time out after 10 s,
idle keep-alive after 4 s (undici defaults).

The dispatcher is composed to send every `HEAD` with `reset: false`. undici
closes the socket after each HEAD by default (`client-h1.js`, "interop with
misbehaving servers" that send a body), and `exists()`/`stat()` are HEADs on
every cache miss, so each one cost a new TLS connection to R2.

The cap only helps if every R2 body is read to the end. `MediaService` never
streams an R2 body into anything: it reads it with `getBuffer()` first. Two ways
this went wrong:
- `.pipe()` into sharp left the source with no `'error'` listener, so a body that
  broke off (reset, `bodyTimeout`) was an uncaught exception that killed the pod.
  sharp buffers the whole input anyway, so streaming saved nothing.
- Copying a document by passing the GET body to `put()` held the GET socket,
  paused, while the PUT waited for one from the same pool. undici's `bodyTimeout`
  never fires on a paused body, so 50 of those deadlock the pool for good.

The signature is validated before the download, and image transforms and PDF
renders run at most `MAX_CONCURRENT_TRANSFORMS` (4) at a time. Each one holds
its original in memory, and sharp's work shares libuv's thread pool with the
`dns.lookup` behind every R2 connect, so the media image sets
`UV_THREADPOOL_SIZE=16`.

**What failed.** The media pod periodically lost IPv4 connectivity to Cloudflare
R2 (`*.eu.r2.cloudflarestorage.com`); its last log line was a burst of
`AggregateError [ETIMEDOUT]` — every IPv4 address `ETIMEDOUT`, every IPv6
`ENETUNREACH`. With no socket cap, each image/document request opened another
connect that hung and piled up until the pod stopped answering `/health`:
readiness dropped it (a **502** from the OpenShift route, which the API's
`/health` reports as `media-server: down`) and liveness killed it (**exit 137**).
`tsri` restarted 15× in 13d, `bajour` 18× in 29d (verified 2026-10-20, still on
the minio client, whose default agent had no connect timeout either).

**The trigger is egress, not the app.** Every media pod egresses through one NAT
IP (`116.202.165.28`, FRA/DE — `cloudflare.com/cdn-cgi/trace` returns it from
three pods across two nodes), so ~30 media instances share one source IP to R2
and the busiest are the canaries. The cap is defence-in-depth so a storage blip
queues requests instead of killing the pod. The shared-egress bottleneck lives
outside this repo, and nothing here guards it.

**Why the cap, not just timeouts.** Node's global `fetch` dispatcher opens a
socket per concurrent request, without limit. A connect timeout bounds how long
each hung socket lives, not how many there are — that scales with traffic (×3
with `S3Disk`'s retries). Only the cap bounds it regardless of load.

**Forcing `family: 4` is not needed.** It looks like the fix for the
`ENETUNREACH` noise but changes nothing in an outage: the IPv6 attempts fail in
~0 ms, Happy Eyeballs abandons every address but the last after 250 ms, and the
last one hangs until the connect timeout either way (measured on Node 22.16).

**Load-bearing:** `fetch: createStorageFetch()` sits in the options _shared_ by
both disks — one dispatcher, so the cap covers the whole R2 origin (a fetch per
disk would double it). `fetch` and `Agent` must both come from the `undici`
package: Node 22 bundles undici 6, and a v7 dispatcher is not guaranteed to work
with the global `fetch`. The `as unknown as typeof globalThis.fetch` cast is
only there because undici's types and `@types/node`'s don't line up.

Pinned by `storage-fetch.spec.ts`, which checks the cap and the timeouts through
the real `fetch` against a local server. The wiring in `app.module.ts` is not tested.

### ⚠️ cache-manager 7: TTLs are milliseconds, `max` is ignored, tiers don't backfill

`CacheModule.register({ttl, max})` without `stores` builds a plain Keyv `Map`.
`ttl` is in **milliseconds**: the media server's old `259200` was meant as 3 days
but gave 4.3 min, so nearly every image went back to R2. `max` is silently
dropped, so the map grew with every variant ever requested.

Layered `stores: [memory, redis]` don't work as a two-level cache either
(`cache-manager/dist/index.mjs` `get`):
- A hit in a later store is never copied into an earlier one, so every replica
  would ask Redis on every request.
- `nonBlocking` races the stores. The memory store answers `undefined` first
  and Redis is never asked.

`TieredKeyvStore` (`libs/kv-ttl-cache/api`) is the two-level cache instead:
one store per cache that reads memory, then Dragonfly, and copies hits back.

### ⚠️ The media server shares its link cache, but never its misses

`apps/media` imports `DragonflyModule.forRoot()`, `KvCacheModule.forRoot()`
(no Prisma codec) and `MediaLinkCacheModule`; it runs no website or release
code. `libs/media/api` and `apps/media` are tagged `scope:runtime-shared` and
may not import `scope:api-only` libs (`website-revalidation`,
`public-content-cache`); `check-runtime-deps.js` still guards the image
against Apollo and Prisma. The profiles behind
[`LinkCache`](../../libs/media/api/src/lib/link-cache/link-cache.ts), each
shared one kept locally for 2 s:
- `media:links` (`val:media:links:<sha>`): objects that exist. Shared, 3 days,
  across releases.
- `media:rejected-variants` (`val:<release>:media:rejected-variants:<sha>`):
  variants the guard rejects (400), 1 h, per release since a deploy can change
  the guard's limits. Only signed requests get that far.
- `media:missing-links`: objects that don't exist. 4 h and **local only**.
- `media:generations` (`val:media:generations:<sha>`): written only by the
  authenticated image/document `DELETE`, 3 days. Every link key hashes
  `[id, generation, variant]`, so a delete orphans all variants of that id on
  every replica within 2 s (each replica re-reads an id's generation at most
  every 2 s, remembered in the local `media:generation-checks`). Variants
  cannot be deleted one by one: their keys are hashes and `SCAN` is denied.

**Load-bearing:** anyone can request random image or document ids without a
signature, and production Dragonfly never evicts and is shared by every
medium. Sharing misses would let one medium's media server fill it for all of
them, and so would keys as long as the request line. That is why misses stay
local and every key is a sha256. While Dragonfly is unreachable every value,
misses included, is kept for at most 30 s, so the media server goes back to R2
more often for the length of the outage.
A Dragonfly misconfiguration crash-loops the media pod, as it does the API's,
so the media image ships `/wepublish/ca.crt` for `NODE_EXTRA_CA_CERTS`.

---

### ⚠️ The newsletter renderer is shared, and several things keep it working

`libs/newsletter/email` draws the Puck canvas *and* the mail. Load-bearing:
`renderNewsletter` lives behind `@wepublish/newsletter/email/render`, outside
the barrel, so the editor bundle never pulls in `react-dom/server`; and
`apps/api-example/tsconfig.app.json` sets `jsx: react-jsx`, or the API build
fails on the lib's TSX. The editor loads
the newsletter routes with `React.lazy`: Puck's stylesheet `@import`s a font
from rsms.me, and eagerly bundled it held up every editor page. Mail
images are asked for as `format: 'jpeg'` (png/gif kept): the media server's
default WebP is an empty frame in Outlook. `format` is deliberately not in the
GraphQL `ImageTransformation`, so the public API cannot multiply cached variants.

Pinned by `render.spec.tsx`, `newsletter-render.service.spec.ts`,
`media.service.spec.ts` and `novaMediaAdapter.spec.ts`; Nx's
`enforce-module-boundaries` rejects any static import of the lazy-loaded
`newsletter-editor` in the editor app. The renderer's runtime packages (`react`,
`react-dom`, `@react-email/components`, and `tslib`, because the API's webpack
gives `.tsx` to ts-loader with `importHelpers`, not swc) must stay in
`apps/api-example/package.json` — see [infrastructure.md](infrastructure.md).

---

## Adding an entry

Keep the house style: a future agent must be able to tell _why_ the obvious
change is wrong without re-running your debugging session.

```markdown
### ⚠️ <one-line claim, in present tense>

<What the code does now, with a link to the file. Quote an existing inline
comment if there is one.>

<What actually failed, with concrete evidence — the error string, the row count,
the measured number. "It broke" is not evidence.>

<Why the obvious alternative cannot work. This is the part that stops the next
refactor.>

**Load-bearing:** <which specific lines must not be removed, and what happens
if they are.>

Pinned by `<path/to/the.spec.ts>` ← if a test guards it. If nothing guards it,
say so explicitly: "Nothing guards this — a regression here is silent."
```

Rules of thumb:

- **Date a fact you verified against live behaviour** ("verified against a real
  Mailgun response on 2026-08-25"), so a reader knows how stale it may be.
- **Prefer numbers to adjectives.** "Died at ~5 000 rows" beats "died partway".
- **Delete an entry when the constraint is genuinely gone.** A stale gotcha is
  worse than none — it makes readers distrust the whole file.
