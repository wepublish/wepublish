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
| listed (`auth:sessions`, `settings`, `website-settings`, `navigations`, `banners`, `member-plans`, `peer-profile`, `peering:remote-profiles`, `crowdfunding`, `ga4`, `graphql:responses`, `graphql:comments`, `content:articles`, `content:pages`, `content:authors`, `content:images`, `content:paywalls`, `content:polls`, `tracking-pixels`) | Dragonfly key `<REDIS_KEY_PREFIX>::val:<APP_RELEASE_ID or dev>:ns:<namespace>:v<version>:<key>` (pods of different releases never read each other's values, but share versions), plus a 2 s copy in memory |
| everything else, including all integration settings (`settings:paymentprovider`, `settings:mailprovider`, …) | process memory only |

Integration secrets never reach Dragonfly, enforced three ways:

- a namespace that is not listed stays in memory, so a new integration is safe
  by default;
- the list refuses any `settings:…` namespace when the api starts;
- a value with a field named like `apiKey`, `secret`, `privateKey`, `password`,
  `token` or `credential*` is kept in memory and logged instead of shared.

Sessions are shared without their token (the key is a sha256 of it; the api adds
the token back on read). Empty results (`null`) and values over 256 KB stay in
memory.

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
— cache plain data.

A replica re-reads a namespace version at most every 2 seconds, so a reset on
one replica reaches the others within 2 s; the replica that reset sees it
immediately.

If a Dragonfly command fails or does not answer within 500 ms, the replica
caches in memory only and does not ask Dragonfly again for 5 s (`Dragonfly
unavailable, caching on this replica only …` is logged at most once per 5 s, not
per command). Requests do not fail or queue. A reset that could not be written is
kept and written again every 5 s until Dragonfly takes it, then once more 3 s
later (another replica may have created an older version meanwhile), so no
replica falls back to the older version.
Batches (`getOrLoadManyNs`) read Dragonfly with one `MGET`. At boot the module
pings Dragonfly and logs an error if it is unreachable (wrong password, ACL user
or CA), and warns in production when `REDIS_URL` is missing. `/health` (watched
by UptimeRobot) reports `dragonfly` down while `REDIS_URL` is unset or Dragonfly
does not answer (`dragonflyStatus()`); the Kubernetes probes
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
| `invalidate(...contents)` | those content caches + anonymous answers, and the answers again 3 s later (another replica may have built one from content that was stale for up to 2 s) | publish, unpublish, delete, updates of published articles/pages; authors, tags, events, paywalls, image updates/deletes, event import |
| `invalidateDraft(...contents)` | only those content caches | create, update of unpublished, duplicate, restore, discard; peer import |
| `invalidateArticlePages(...articles)` | the website pages of those articles (`/a/<slug>`, `/a/id/<id>`), see [Website pages](#website-pages) | publish, unpublish, delete and updates of published articles (old and new slug); `ArticlePublicationWatcher` |
| `invalidateComments(removed, ...articles)` | answers containing `commentsForItem` / `ratingSystem` and the pages of those articles; with `removed` also all anonymous answers (comment blocks inside articles/pages) | create (`false`, with the article once an editor publishes it), approve (`false`, with the commented article), edit/reject/delete (`true`, with the commented article); rating system changes; not ratings |
| `invalidateAt(time, ...contents)` | `invalidate(...contents)` at that time (+2 s) | page publish with a future `publishedAt` (the watchers only look 70 s ahead once a minute); an article publish hands its time to `ArticlePublicationWatcher.schedule` instead, which then also clears the pages of every article and revision going live |
| `invalidateNavigations()` | cached navigations and their links | article/page delete (links cascade) |

Scheduled content goes live without a write (views compare `publishedAt` with
`CURRENT_TIMESTAMP`), so `ArticlePublicationWatcher` / `PagePublicationWatcher`
look up publications due in the next 70 s every minute and clear the caches
2 s after each (`PublicationTimers`). `EventScheduleWatcher` does the same for
events starting or ending, since "upcoming" lists compare with `new Date()`.

A like or dislike deletes only that article's `id:`/`slug:` entries, a poll
vote only that poll's `id:` entry; anonymous answers and lists may show the old
count for up to 5 min. Poll edits, answers, external vote sources and deleted
votes call `invalidate('polls')`. Different API replicas may serve the old
content for up to 2 s after a write.

`commentsForItem` for readers (everyone without `CanGetComments`) reads the
approved comments of an article or page from `graphql:comments`
(`items:<type>:<id>`, 5 min): ratings already counted, only the latest
revision, no rating rows — rater ids and fingerprints never reach Dragonfly. A
logged-in reader's own unapproved comments and own ratings come from two small
queries on top. Values and comment answers share the namespace, so every
`invalidateComments` / `invalidateReaderComments` retires both at once and a
replica never mixes versions; a comment rating deletes only that item's entry,
so logged-in readers see it at once and anonymous answers within 5 min.
Sessions (`auth:sessions`) are kept 5 min: user, role, session, peer token and
payment provider customer writes reset them.

`TrackingPixelService.addMissingArticleTrackingPixels` (run on every `article`
query) remembers per article and provider set that the pixels are complete for
24 h, retries a failed pixel at most every 15 min, and deletes the article's
cached pixel rows when it changed them. Member plan writes call
`invalidate('paywalls')` (paywall member plans embed them) and payment method
writes `invalidate()`; paywall bypasses are never cached.

## GraphQL answers

`GraphqlResponseCachePlugin` (registered through `GraphqlResponseCacheModule`)
answers a repeated query from `graphql:responses` for 5 min (30 s when the
answer contains an enabled `PollBlock` or `CrowdfundingBlock`, so vote counts
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

The key includes the query, variables and the versions of `graphql:content`,
`navigations`, `banners`, `settings`, `website-settings`, `peer-profile`,
`member-plans`, `peering:remote-profiles` (plus `graphql:comments` for comment
fields), so a reset of any of them retires the answers.

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
a comment does not.

Article pages (`/a/<slug>`, `/a/id/<id>`) ignore `website:pages`, so a
publication does not rebuild every article. They follow two versions instead:

| Version | Changes | Rebuilds |
| --- | --- | --- |
| `nsv:website:path:<path>` | `resetWebsitePaths` via `invalidateArticlePages` / `invalidateComments(…, article)`, at once and again 6 s later; kept 4 h, and like every version written again once Dragonfly answers if it failed | that article only |
| `nsv:website:layout` | a reset of a namespace in `WEBSITE_LAYOUT_NAMESPACES` (navigations, banners, settings, peer profile, member plans, paywalls …), at once and again 6 s later | every article page |

Anything else an article page shows (related articles, hot & trending, teasers,
authors, comment ratings) waits for its `revalidate`. Browsers show the comments
of the html: `ssrForceFetchDelay` turns the comment list's first query into
`cache-first`, so a moderator decision has to rebuild the page.

## Jobs across replicas

`claim(name, ttlMs)` sets `<REDIS_KEY_PREFIX>::lock:<name>` with `SET NX PX`
(allowed by the production ACL; no Lua, `-script` forbids it) and answers `true`
for the one replica that got it, `false` for the others and `undefined` when
it cannot tell (no `REDIS_URL`, Dragonfly unreachable or failing). Claims are
never released, they expire.
`PeriodicJobExecutor` claims `nightly-job` for 12 h: that replica runs the
periodic jobs and then the Mailchimp sync, the others skip both. With
`undefined` no replica runs and the executor logs an error; the next run catches
up the missed days (`getOutstandingRuns`). `AuditLogRetentionService` does the
same with `audit-log-retention`. `SlateToPmMigrator` claims each cron job for
1 s less than its interval, so one replica migrates per tick; without an answer
it migrates anyway (rows are rewritten idempotently, unmigrated content would
stay broken).

## Hit rates in Sentry

Every `getOrLoadNs`, every `getOrLoadManyNs` batch and the anonymous-answer
lookup is a Sentry span (`op: cache.get`, name and `cache.key` = the namespace,
never the key; `cache.hit`, for batches also `cache.keys` / `cache.misses`; a
call that did not run its loader is a hit). Spans exist only inside sampled
traces (`onlyIfParent`), so hit rates per namespace and GraphQL operation show
under *Insights → Caches* from the 10 % of production requests Sentry samples.

## Running unit tests

```bash
npx nx test kv-ttl-cache.module-api
```

Vitest. `kv-ttl-cache.dragonfly.spec.ts` runs against a real Dragonfly when
`REDIS_TEST_ADMIN_URL` is set (CI does; locally
`REDIS_TEST_ADMIN_URL=redis://default:dragonfly@localhost:6379` after
`npm run start:docker`) and is skipped otherwise. It creates its own ACL user with
the production rules.
