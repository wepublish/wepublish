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
| listed (`auth:sessions`, `settings`, `website-settings`, `navigations`, `banners`, `member-plans`, `peer-profile`, `peering:remote-profiles`, `crowdfunding`, `ga4`, `graphql:responses`, `content:articles`, `content:pages`, `content:authors`, `content:images`, `content:paywalls`, `tracking-pixels`) | Dragonfly key `<REDIS_KEY_PREFIX>::val:ns:<namespace>:v<version>:<key>`, plus a 2 s copy in memory |
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

Values are serialized by `kv-ttl-cache-serializer.ts`: `Date`s come back as
`Date`s and every read returns a copy; `Decimal`, `BigInt`, `Map`, `Set` and
class instances do not survive — cache plain data.

A replica re-reads a namespace version at most every 2 seconds, so a reset on
one replica reaches the others within 2 s; the replica that reset sees it
immediately.

If a Dragonfly command fails, the replica caches in memory only and does not
ask Dragonfly again for 5 s (`Dragonfly unavailable, caching on this replica
only …` is logged). Requests do not fail, queue or wait for a timeout.

## Published content

The article, page, author, image and paywall dataloaders (including article
tags, tracking-pixel rows and paywall member plans), `getArticleBySlug`,
`getPageBySlug`, `getArticles` and `getPages` (except full-text search) read
through `content:<articles|pages|authors|images|paywalls>` for 5 min
(`CONTENT_CACHE_TTL_SECONDS`), for every request including logged-in ones —
they cache what the database query returns for those arguments, nothing
per-user. Writers call `PublicContentCacheInvalidator`:

| Call | Clears | Used by |
| --- | --- | --- |
| `invalidate(...contents)` | those content caches + anonymous answers, and the answers again 3 s later (another replica may have built one from content that was stale for up to 2 s) | publish, unpublish, delete, updates of published articles/pages; authors, tags, events, paywalls, image updates/deletes, event import |
| `invalidateDraft(...contents)` | only those content caches | create, update of unpublished, duplicate, restore, discard; peer import |
| `invalidateComments()` | answers containing `commentsForItem` / `ratingSystem` | every comment write except ratings, rating system changes |

Scheduled content goes live without a write (views compare `publishedAt` with
`CURRENT_TIMESTAMP`), so `ArticlePublicationWatcher` / `PagePublicationWatcher`
look up publications due in the next 70 s every minute and clear the caches
2 s after each (`PublicationTimers`). `EventScheduleWatcher` does the same for
events starting or ending, since "upcoming" lists compare with `new Date()`.

A like or dislike deletes only that article's `id:`/`slug:` entries; anonymous
answers and lists may show the old count for up to 5 min. Comment ratings clear
nothing. Different API replicas may serve the old content for up to 2 s after a
write.

`TrackingPixelService.addMissingArticleTrackingPixels` (run on every `article`
query) remembers per article and provider set that the pixels are complete for
24 h, retries a failed pixel at most every 15 min, and deletes the article's
cached pixel rows when it changed them. Member plan writes also clear
`content:paywalls` (paywall member plans embed them); paywall bypasses are never
cached.

## GraphQL answers

`GraphqlResponseCachePlugin` (registered through `GraphqlResponseCacheModule`)
answers a repeated query from `graphql:responses` for 5 min when:

- the request carries no login (`Authorization` header, `access_token` in url or
  body) and no `preview` header — so nothing per-user is ever cached;
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

## Running unit tests

```bash
npx nx test kv-ttl-cache.module-api
```

Vitest. `kv-ttl-cache.dragonfly.spec.ts` runs against a real Dragonfly when
`REDIS_TEST_ADMIN_URL` is set (CI does; locally
`REDIS_TEST_ADMIN_URL=redis://default:dragonfly@localhost:6379` after
`npm run start:docker`) and is skipped otherwise. It creates its own ACL user with
the production rules.
