# kv-ttl-cache.module-api

`KvTtlCacheModule` / `KvTtlCacheService`: a TTL key-value cache with namespaces
(`getOrLoadNs`, `resetNamespace`) and in-flight de-duplication, used for
sessions, settings, page data, provider settings and similar lookups.
`GraphqlResponseCacheModule` caches anonymous GraphQL answers on top of it.

## Stores

Whether a namespace's values go to Dragonfly is decided by one list,
`SHARED_NAMESPACES` in `kv-ttl-cache-shared-namespaces.ts`:

| Namespace | Values |
| --- | --- |
| listed (`settings`, `website-settings`, `navigations`, `banners`, `member-plans`, `peer-profile`, `peering:remote-profiles`, `crowdfunding`, `ga4`, `graphql:responses`, `graphql:comments`, `content:articles`, `content:pages`, `content:authors`, `content:images`, `content:paywalls`, `content:polls`, `tracking-pixels`) | Dragonfly key `<REDIS_KEY_PREFIX>::val:<APP_RELEASE_ID or dev>:ns:<namespace>:v<version>:<key>` (pods of different releases never read each other's values, but share versions), plus a 2 s copy in memory |
| everything else, including all integration settings (`settings:paymentprovider`, `settings:mailprovider`, …) | process memory only |

Integration secrets never reach Dragonfly, enforced three ways:

- a namespace that is not listed stays in memory, so a new integration is safe
  by default;
- the list refuses any `settings:…` namespace when the api starts;
- a value with a field named like `apiKey`, `secret`, `privateKey`, `password`,
  `token` or `credential*` is kept in memory and logged instead of shared.

Sessions (`auth:sessions`) are not listed: they decide logins and carry readers'
personal data, and website pods use the same Dragonfly user. Their version is
shared, so a logout or role change still reaches every replica within 2 s.
Empty results (`null`) and values over 256 KB stay in memory; a value whose
Dragonfly write failed stays in memory for at most 30 s. While Dragonfly is
unreachable, memory-only values are kept at most 30 s too, and 30 s into the
outage a replica stops using the ones cached before it (a reset elsewhere cannot
reach it then), so a logout on another replica takes effect within a minute.

Process memory is one LRU store of at most 50 000 entries and 32 MB, for the
in-memory namespaces, the 2 s copies and the fallback below.

| Environment | Behaviour |
| --- | --- |
| `REDIS_URL` unset (unit tests, dev without Docker) | everything in memory; a reset only affects this replica |
| `REDIS_URL` + `REDIS_KEY_PREFIX` | namespace versions in `<REDIS_KEY_PREFIX>::nsv:<namespace>` (created with `SET NX`), listed namespaces shared |
| `REDIS_URL` without `REDIS_KEY_PREFIX` | refuses to start |

Values are serialized by `kv-ttl-cache-serializer.ts`, in memory too: `Date`s
and Prisma `Decimal`s (e.g. `payrexx_vatrate`) come back as such and every read
returns a copy; `BigInt`, `Map`, `Set` and other class instances do not survive
— cache plain data (a value that cannot be serialized at all is answered but not
cached). Data that merely looks like the serializer's tags (e.g. a
comment containing `{"$kvDecimal": …}`) is escaped and comes back unchanged.

A replica re-reads a namespace version at most every 2 seconds, so a reset on
one replica reaches the others within 2 s; the replica that reset sees it
immediately. `getNamespaceVersions(namespaces)` re-reads all stale ones with one
`MGET` (the answer cache and the provider registry use it), so a cache hit needs
no Dragonfly round trip.

If a Dragonfly command fails or does not answer within 500 ms, the replica
caches in memory only and does not ask Dragonfly again for 5 s (`Dragonfly
unavailable, caching on this replica only …` is logged at most once per 5 s, not
per command). Requests do not fail or queue. A reset that could not be written is
kept and written again every 5 s until Dragonfly takes it, then once more 3 s
later (another replica may have created an older version meanwhile), so no
replica falls back to the older version. Commands sent while the connection is
being set up wait for that one connect (at most 1 s, then the half-open client
is destroyed; node-redis' own timeout does not cover the handshake). A command
timeout never destroys a connection that is still being set up, and a client
that ended up ready but closed reconnects.
Batches (`getOrLoadManyNs`) read Dragonfly with one `MGET`. At boot the module
pings Dragonfly and logs an error if it is unreachable (wrong password, ACL user
or CA), and warns in production when `REDIS_URL` is missing. `/health` (watched
by UptimeRobot) reports `dragonfly` down while `REDIS_URL` is unset or Dragonfly
refuses a probe write to `<REDIS_KEY_PREFIX>::health` (`dragonflyStatus()`:
unreachable, wrong prefix, out of memory); the Kubernetes probes
(`/health/readinessProbe` etc.) ignore it, so pods stay in service.

## Published content

The article, page, author, image, paywall and poll dataloaders (including
article tags, tracking-pixel rows, paywall member plans and poll vote counts),
`getArticleBySlug`, `getPageBySlug`, `getArticles` and `getPages` (except
full-text search) read through
`content:<articles|pages|authors|images|paywalls|polls>` for 5 min
(`CONTENT_CACHE_TTL_SECONDS`), for every request including logged-in ones —
they cache what the database query returns for those arguments, nothing
per-user. Writers call `PublicContentCacheInvalidator`:

| Call | Clears | Used by |
| --- | --- | --- |
| `invalidate(...contents)` | those content caches + anonymous answers, and the answers again 3 s later (another replica may have built one from content that was stale for up to 2 s) | publish, unpublish, delete, updates of published articles/pages; authors, tags, events, paywalls, image updates/deletes, event import; block template/style updates and deletes; `SlateToPmMigrator` after a batch that changed rows |
| `invalidateDraft(...contents)` | only those content caches (plus anonymous answers that show `draft` or `pending`, which are versioned by `content:articles`/`content:pages`) | create, update of unpublished, duplicate, restore, discard; peer import; image upload and a reader's own profile image |
| `invalidateArticlePages(...articles)` | the website pages of those articles (`/a/<slug>`, `/a/id/<id>`), see [Website pages](#website-pages) | publish, unpublish, delete and updates of published articles (old and new slug); `ArticlePublicationWatcher` |
| `invalidateComments(removed, ...articles)` | answers containing `commentsForItem` / `ratingSystem` and the pages of those articles; with `removed` also all anonymous answers (comment blocks inside articles/pages) | create (`false`, with the article once an editor publishes it), approve (`false`, with the commented article), edit/reject/delete (`true`, with the commented article); rating system changes; not ratings; a commenter's name, flair or profile image (`false`), a deleted user's comments (`true`, with the commented articles), an editor comment with tags (`true`, comment blocks select by tag) |
| `invalidateReaderComments(removed, ...articles)` | like `invalidateComments`, but with `removed` only the anonymous answers, not `website:pages` | a reader's comment that is approved at once, a reader editing an approved comment (`removed` = it was public before) |
| `invalidateAt(time, ...contents)` | `invalidate(...contents)` at that time (+2 s) | page publish with a future `publishedAt` (the watchers only look 70 s ahead once a minute); an article publish hands its time to `ArticlePublicationWatcher.schedule` instead, which then also clears the pages of every article and revision going live |
| `invalidateNavigations()` | cached navigations and their links | article/page delete (links cascade) |
| `invalidateArticleAnswers(...articles)` | all anonymous answers (not `website:pages`) and the pages of those articles | `TrackingPixelService` once a working pixel exists |
| `invalidateArticleLayout()` | `website:layout`, so every article page rebuilds on its next visit | unpublish and delete of articles and pages (their teasers show elsewhere), block template/style updates and deletes, migrated article revisions |

Scheduled content goes live without a write (views compare `publishedAt` with
`CURRENT_TIMESTAMP`), so `ArticlePublicationWatcher` / `PagePublicationWatcher`
look up publications due in the next 70 s every minute and clear the caches
2 s after each (`PublicationTimers`). `EventScheduleWatcher` does the same for
events starting or ending, since "upcoming" lists compare with `new Date()`.

A like or dislike deletes only that article's `id:`/`slug:` entries, a poll
vote only that poll's `id:` entry (`delNs`: under the version this replica knows
and the one in Dragonfly, again 3 s later; a batch load that started before the
delete does not store its result); anonymous answers and lists may show the old
count for up to 5 min. Poll edits, answers, external vote sources and deleted
votes call `invalidate('polls')`. Different API replicas may serve the old
content for up to 2 s after a write.

`commentsForItem` for readers (everyone without `CanGetComments`) reads the
approved comments of an article or page from `graphql:comments`
(`items:<type>:<id>`, 5 min): ratings already counted, only the latest
revision, no rating rows — rater ids and fingerprints never reach Dragonfly. A
logged-in reader's own comments (every state, fresh from the database, replacing
their cached copy — so the author sees an approved comment at once even where
the list is still the old one) and own ratings come from two small queries on
top. Values and comment answers share the namespace, so every
`invalidateComments` / `invalidateReaderComments` retires both at once and a
replica never mixes versions; a comment rating deletes only that item's entry,
so logged-in readers see it at once and anonymous answers within 5 min.
Sessions (`auth:sessions`) are kept 5 min in the api's memory: user, role, session, peer token and
payment provider customer writes reset them.

`TrackingPixelService.addMissingArticleTrackingPixels` (run on every `article`
query) remembers per article and provider set that the pixels are complete for
24 h, retries a failed pixel at most every 15 min, and deletes the article's
cached pixel rows when it changed them. It runs once at a time per article on a
replica and claims `tracking-pixels:<articleId>` for 60 s across replicas, so
concurrent first reads request one pixel; a replica that loses the claim waits
up to 3 s for the other one to finish, so its answer carries the pixel too. A
retry replaces every failed row of the provider. Any other error (provider
settings unreadable, database) is logged, does not fail the article query and
is retried after 15 min, so no reader waits for a replica that failed. Once a
working pixel exists, `invalidateArticleAnswers` retires anonymous answers and
that article's pages, so they carry it. Member plan writes call
`invalidate('paywalls')` (paywall member plans embed them) and payment method
writes `invalidate()`; paywall bypasses are never cached.

## GraphQL answers

`GraphqlResponseCachePlugin` (registered through `GraphqlResponseCacheModule`)
answers a repeated query from `graphql:responses` for 5 min (30 s when the
answer contains an enabled `PollBlock` or `CrowdfundingBlock` — also when the
client selects a `poll`/`crowdfunding` field without `__typename` — so vote counts
and amounts reach the 60 s pages of the websites within ~1.5 min) when:

- the request carries no login (`Authorization` header, `access_token` in url or
  body) — so nothing per-user is ever cached; a `preview` header is ignored
  without a login (preview needs `CanPreview`) and skips the cache with one;
- every root field is in `CACHEABLE_QUERIES` — `challenge`, `me` and everything
  else unlisted always run;
- it is a query and the answer has no errors.

Logged-in requests only *read* answers, and only for
`SAME_FOR_EVERYONE_QUERIES` (`navigations`, `peerProfile`): they get exactly
what an anonymous visitor gets, and answers computed for them are never stored.

The key includes the query, the variables the operation declares (sorted, so
order and undeclared extras do not matter) and the versions of
`graphql:content`, `navigations`, `banners`, `settings`, `website-settings`,
`peer-profile`, `member-plans`, `peering:remote-profiles` — plus
`graphql:comments` for comment fields, `content:images` for `getImagesByTag`
and `content:articles`/`content:pages` when a `draft` or `pending` field is
selected (externals may read drafts anonymously) — so a reset of any of them
retires the answers.

## Website pages

A reset of any namespace in `PAGE_CONTENT_NAMESPACES`
(`kv-ttl-cache-shared-namespaces.ts`, the list above) also changes
`website:pages`, which the websites' page cache reads from
`<REDIS_KEY_PREFIX>::nsv:website:pages` to rebuild older pages (see the
[utils-website README](../../utils/website/README.md)). It changes once
nothing happened for 4 s (so after the second reset of a publication, ~7 s),
at most once a minute across all replicas (`nsw:website:pages` holds the
window), and at the latest a minute after the first of a steady stream of
changes. Pending changes live in Dragonfly (`nsl`/`nsf`/`nsd:website:pages`)
and every replica checks them every 5 s, so a restart or crash loses none.
Drafts (`content:*`), sessions, comments of readers (`invalidateReaderComments`)
and `resetNamespace(ns, { pages: false })` leave it alone; a moderator removing
a comment does not. The api also keeps `<REDIS_KEY_PREFIX>::website:heartbeat`
(every 20 s, 60 s TTL); websites that do not see it treat the versions as
missing and refresh every 60 s, so a website on Dragonfly next to an api that
writes no versions never keeps pages for an hour. The first replica of an
`APP_RELEASE_ID` other than `release:current` claims
`release:<id>:after:<previous>` (10 min), stores its id there and changes
`website:pages` and `website:layout` once, since another release may render
pages differently — a rollback included.

Article pages (`/a/<slug>`, `/a/id/<id>`) ignore `website:pages`, so a
publication does not rebuild every article. They follow two versions instead:

| Version | Changes | Rebuilds |
| --- | --- | --- |
| `nsv:website:path:<path>` | `resetWebsitePaths` via `invalidateArticlePages` / `invalidateComments(…, article)`, at once and again 6 s later; kept 4 h, and like every version written again once Dragonfly answers if it failed | that article only |
| `nsv:website:layout` | a reset of a namespace in `WEBSITE_LAYOUT_NAMESPACES` (navigations, banners, settings, peer profile, member plans, paywalls …), at once and again 6 s later | every article page |

A resolver that answers a fallback because something failed (hot & trending
and teaser lists while Google Analytics is down) calls `skipAnswerCache(context)`,
so that answer is not stored. The `ga4` view map is keyed by property, start day
and article prefix; remote peer profiles by host and a sha256 of the token.

Anything else an article page shows (related articles, hot & trending, teasers,
authors, comment ratings) waits for its `revalidate`. Browsers show the comments
of the html: `ssrForceFetchDelay` turns the comment list's first query into
`cache-first`, so a moderator decision has to rebuild the page.

## Jobs across replicas

`claim(name, ttlMs)` sets `<REDIS_KEY_PREFIX>::lock:<name>` with `SET NX PX`
(allowed by the production ACL; no Lua, `-script` forbids it) and answers `true`
for the one replica that got it, `false` for the others and `undefined` when
it cannot tell (no `REDIS_URL`, Dragonfly unreachable or failing);
`{ retryForMs }` asks again every 5 s while it cannot tell. The lock holds a
token of that one `claim` call, so a retry whose earlier attempt landed although
its answer got lost still wins. Claims are never released, they expire. `increment(name, ttlMs)` / `count(name)` /
`forgetCount(name)` keep a counter in `<REDIS_KEY_PREFIX>::count:<name>`
(`SET 0 NX PX`, `INCR`, then `PEXPIRE`: the key is born with its expiry, so a
failed `PEXPIRE` cannot keep it forever, and the window restarts with every
increment; `undefined` without Dragonfly). `TotpService` uses both: a code is refused once
`lock:totp-used:<user>:<time step>` exists (90 s; the step, not the code, so no code material is stored), and every attempt is counted
in `count:totp-failures:<user>` before the code is checked (15 min, reset on
success), so parallel guesses beyond 5 are refused on every replica; the
per-replica maps stay as fallback and forget failures 15 min after the last
one. The time step is computed from the same clock reading the code was checked
against.
`PeriodicJobExecutor` claims `nightly-job` for 12 h: that replica runs the
periodic jobs and then the Mailchimp sync, the others skip both. Without
`REDIS_URL` it runs as before Dragonfly, kept to one replica by the database
(`concurrentExecute`: random wait, then `isAlreadyAJobRunning`). With Dragonfly
configured but unreachable no replica runs (a double run could charge twice)
and the executor logs an error; the next run catches up the missed days and a
run left unfinished for over 12 h (`getOutstandingRuns`).
`AuditLogRetentionService` claims `audit-log-retention` the same way, but runs
on every replica when the claim cannot tell, since deleting old entries twice
is harmless. `SlateToPmMigrator` claims each cron job for
1 s less than its interval, so one replica migrates per tick; without an answer
it migrates anyway (rows are rewritten idempotently, unmigrated content would
stay broken).

## Integration providers

`ProviderRegistryService` builds the payment, tracking-pixel, mail and
challenge providers from their settings. The replica that saves a setting
rebuilds at once; every replica also compares the versions of
`settings:paymentprovider`, `settings:tracking-pixel`, `settings:mailprovider`
and `settings:challenge` every 5 s and rebuilds when another replica changed
them, so a new provider, a deleted one or a type change reaches all replicas
within ~7 s.

## Hit rates in Sentry

Every `getOrLoadNs`, every `getOrLoadManyNs` batch and the anonymous-answer
lookup is a Sentry span (`op: cache.get`, name and `cache.key` = the namespace,
never the key; `cache.hit`, for batches also `cache.keys` / `cache.misses`; a
call that did not run its loader is a hit). Spans exist only inside sampled
traces (`onlyIfParent`), so hit rates per namespace and GraphQL operation show
under *Insights → Caches* from the 10 % of production requests Sentry samples.
Sentry's own Redis integration is removed (`libs/utils/sentry/config.ts`,
`withoutKeySpans`): its spans carried full keys, session token hashes included.
Root spans that are only database work outside a request (background version
checks, cron queries) are not sampled (`getServerConfig().tracesSampler`).

## Running unit tests

```bash
npx nx test kv-ttl-cache.module-api
```

Vitest, without a Dragonfly: `FakeDragonfly` (`kv-ttl-cache.testing.ts`) stands
in for it, and `kv-ttl-cache-atomic-store.spec.ts` pins that the store only sends
commands the production ACL allows, every key under the medium's prefix.
