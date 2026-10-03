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
`mock-date`, `create-mock` and `graphql-public` — but **not** the Prisma
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

### ⚠️ NestJS stays on Jest — this is not an oversight

Most of the workspace moved to Vitest in `a42088205`, whose message states the
intent plainly: *"swap most from jest to vitest. **nestjs left on jest until new
major release**"*. So `libs/*/api` keep `jest.config.ts` and `jest.fn()`, while
everything else uses `vitest.config.ts` and `vi.fn()`.

`eslint.config.mjs` encodes the same split for spec files — it injects Jest
globals everywhere *and* `vi` as readonly, with the comment *"The backend
(NestJS) projects run on jest, everything else on vitest."*

**Do not migrate a `libs/*/api` project to Vitest** as drive-by cleanup. Check
which config file the project has before writing a test — see
[testing.md](testing.md).

---

### ⚠️ `vitest.config.ts` files are exempt from module boundaries — on purpose

[eslint.config.mjs](../../eslint.config.mjs) turns `@nx/enforce-module-boundaries`
**off** for `**/vitest.config.ts`, because:

> The per-project vitest configs share their setup through the root-level
> `vitest.shared.ts`, which is not part of any project and therefore has to be
> imported by a relative path.

`vitest.shared.ts` in turn re-reads `tsconfig.base.json` and rebuilds the
`@wepublish/*` aliases itself, so *"imports resolve to their source files instead
of built output"*.

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

- `styled` from `@mui/material` → *"Please import `styled` from `@emotion/styled`
  instead."* Mixing the two produces components that ignore the Emotion theme.
- `SensitiveDataUser` from `@wepublish/user/api` → import it **only** when the
  sensitive fields are genuinely required; otherwise use `User`.

The second is a data-exposure guard, not a style preference. If you need
`SensitiveDataUser`, be able to say which field forced it.

---

### ⚠️ Four apps are excluded from the typecheck CI job

[tools/typecheck-websites.sh](../../tools/typecheck-websites.sh) skips
`api-example`, `editor`, `bka`, and `media` — they do not currently typecheck
cleanly, and `website-typecheck.yml` runs this script as-is.

Two failure modes to avoid:

1. Do not "fix" the exclusion list as a side quest — those apps fail for
   unrelated pre-existing reasons.
2. Do not let your change push a **new** app onto that list. If an app you touched
   stops typechecking, fix the app, not the script.

Note the script uses `set -uo pipefail` (no `-e`) and collects failures, so it
reports every failing app rather than stopping at the first.

---

### ⚠️ `schema-v2.graphql` is generated, and only outside production

`apps/api-example/src/nestapp/app.module.ts` sets `autoSchemaFile` to
`'./apps/api-example/schema-v2.graphql'` **only when `NODE_ENV !== 'production'`**
(in production it is `true`, i.e. in-memory). The file is therefore refreshed by
running the API in dev — never by hand.

If codegen produces stale types, the fix is to **start the API** so the SDL is
rewritten, then run `npm run generate-api`. Editing the `.graphql` file directly
gets silently overwritten on the next dev boot. See
[graphql-prisma.md](graphql-prisma.md).

---

### ⚠️ Vitest forces `TZ=UTC` globally

[vitest.setup-tests.ts](../../vitest.setup-tests.ts) sets `process.env['TZ'] = 'UTC'`
before anything else, and also silences one specific React `act(...)` warning.

A test that passes locally in `Europe/Zurich` but relies on local time will
behave differently under Vitest. Assert on explicit UTC instants, or freeze time
(`vi.setSystemTime` / `jest.setSystemTime`) rather than depending on the ambient
zone. Jest projects do **not** get this setup file — set the zone yourself there.

---

### ⚠️ Every Dragonfly key must start with `REDIS_KEY_PREFIX`

All media share database 0; a medium's user may only touch `<prefix>:*` /
`{<prefix>}:*` — anything else is `NOPERM`. `-@dangerous` is not enough:
`CLIENT PAUSE`/`KILL`, `DFLY`, `SCRIPT FLUSH`, `SCAN`/`RANDOMKEY` reach other
media, hence `-@admin -client -script -function -memory -pubsub -scan -randomkey
-dbsize` (verified on v2.0.0, 2026-10-01).

**Load-bearing:** `docker/dragonfly/users.acl` must match `redisacl_user` in
`application-configuration` (`modules/wepublish_app/dragonfly.tf`). Pinned by
`kv-ttl-cache.dragonfly.spec.ts` (runs in CI against Dragonfly).

---

### ⚠️ `KvTtlCacheModule` builds `CACHE_MANAGER` itself; only listed namespaces leave the process

Not `CacheModule.register`: `@nestjs/cache-manager` checks `store instanceof
Keyv`, which fails under Vitest (ESM vs CJS `keyv`) with *"Cannot read
properties of undefined (reading 'includes')"*. Only `SHARED_NAMESPACES` go to
Dragonfly; integration settings (`settings:*`) must never be added (startup
throws). Values are JSON even in memory (master kept live objects):
`kv-ttl-cache-serializer.ts` keeps `Date`s and Prisma `Decimal`s
(`payrexx_vatrate.toNumber()`); `BigInt`/`Map` do not survive. See the
[lib README](../../libs/kv-ttl-cache/api/README.md).

Pinned by `kv-ttl-cache-shared-namespaces.spec.ts`,
`kv-ttl-cache.service.spec.ts`, `kv-ttl-cache-serializer.spec.ts` and
`kv-ttl-cache-options.spec.ts`.

---

### ⚠️ A new write path must clear the cache it changes

Sessions, page data, articles, pages, authors, images, polls, readers'
comments and anonymous GraphQL answers are cached for 5 min — for logged-in
requests too. Writers call
`kv.resetNamespace(...)`, `SessionCacheInvalidator` (user, role, session, peer
token) or `PublicContentCacheInvalidator` (`invalidate` for public changes,
`invalidateDraft` for drafts, `invalidateComments`); otherwise stale data shows
until the TTL ends, in the editor as well. A field joins `CACHEABLE_QUERIES`
only if its anonymous answer is the same for every visitor; see the
[lib README](../../libs/kv-ttl-cache/api/README.md).

Pinned by the `*session-cache*`, `*.cache.spec.ts` and `*content-cache*` specs;
a new write path needs its own test.

---

### ⚠️ nx loads `.env` into every task, tests included

`.env` sets `REDIS_URL` and nx passes it into tests (verified 2026-10-01), so
`jest.setup.ts` and `vitest.setup-tests.ts` delete it. Pinned for Vitest by
`kv-ttl-cache.module.spec.ts`; nothing guards the Jest side. The built api
loads `.env` too (`ConfigModule.forRoot()`), so to run it without Dragonfly set
`REDIS_URL=` (empty) instead of unsetting it.

---

### ⚠️ BullMQ on our Dragonfly needs three things

Verified with bullmq 6.3.11 on v2.0.0 (2026-10-01): Dragonfly must run with
`--lock_on_hashtags` (else *"script tried accessing undeclared key"*), the
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
`register()` in `instrumentation.nextjs.ts` makes every 404 and 5xx `private,
no-store, max-age=0` (`libs/utils/sentry/error-no-store.ts`) so Cloudflare
never keeps one. Pinned by `error-no-store.spec.ts`; nothing checks the wiring
in CI (verified end-to-end 2026-10-01).

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

### ⚠️ Loading the Redis client slows every string method until `restoreFastStringPrototype` runs

`@redis/client` 5 (via `@keyv/redis`) defines `class VerbatimString extends
String`; loading it puts `String.prototype` into V8 dictionary mode, and every
string method in the process gets slower. Next's ETag hash over each cached page
took 3 ms instead of 0.7 ms, cache hits per pod dropped from ~290/s to ~170/s
(verified with `%HasFastProperties` and a CPU profile, Node 22.20, 2026-10-02).
`restoreFastStringPrototype()` reads a property 1 000 times through an object
whose prototype is `String.prototype`, which makes V8 turn it fast again; fewer
than ~100 reads do not.

**Load-bearing:** the call after the imports in `kv-ttl-cache-atomic-store.ts`
(`fast-string-prototype.ts`) and in `createRedisClient` in
`page-cache/shared-store.js`, which also loads the client only when it connects.
Pinned by `fast-string-prototype.spec.ts` and `shared-store.fast-strings.spec.ts`
(fresh `node --allow-natives-syntax`); a new place that loads `@keyv/redis` or
`@redis/client` needs the same call.

---

### ⚠️ The newsletter renderer is shared, and three things keep it working

`libs/newsletter/email` draws the Puck canvas *and* the mail. Load-bearing:
`renderNewsletter` lives behind `@wepublish/newsletter/email/render`, outside
the barrel, so the editor bundle never pulls in `@react-email/render`'s
Prettier; `apps/api-example/tsconfig.app.json` sets `jsx: react-jsx`, or the
API build fails on the lib's TSX; and `newsletter-api` runs Jest with
`NODE_OPTIONS=--experimental-vm-modules`, because `@react-email/render` calls
`import('react-dom/server')` even in its CJS build (*"A dynamic import callback
was invoked without --experimental-vm-modules"*, verified 2026-10-02). Mail
images are asked for as `format: 'jpeg'` (png/gif kept): the media server's
default WebP is an empty frame in Outlook. `format` is deliberately not in the
GraphQL `ImageTransformation`, so the public API cannot multiply cached variants.

Pinned by `newsletter-render.service.spec.ts`, `media.service.spec.ts` and
`novaMediaAdapter.spec.ts`; nothing guards the editor-bundle split.

---

## Adding an entry

Keep the house style: a future agent must be able to tell *why* the obvious
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

Pinned by `<path/to/the.spec.ts>`  ← if a test guards it. If nothing guards it,
say so explicitly: "Nothing guards this — a regression here is silent."
```

Rules of thumb:

- **Date a fact you verified against live behaviour** ("verified against a real
  Mailgun response on 2026-08-25"), so a reader knows how stale it may be.
- **Prefer numbers to adjectives.** "Died at ~5 000 rows" beats "died partway".
- **Delete an entry when the constraint is genuinely gone.** A stale gotcha is
  worse than none — it makes readers distrust the whole file.
