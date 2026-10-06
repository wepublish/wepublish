# utils-website

## Page cache

`next.config.js` sets `cacheHandler` to `page-cache/page-cache-handler.js`, so
every website keeps its ISR pages in memory and shares them with its other pods
through Dragonfly instead of writing them to disk.

| | |
| --- | --- |
| Memory | one LRU of 50 MB per process |
| Dragonfly | `<REDIS_KEY_PREFIX>::page:<BUILD_ID>:<path>`, 3 h, at most 2 MB per page |
| Fresh | the page's own `revalidate` and the `website:pages` version it was rendered under; the api changes it ~4 s after a publication, at most once a minute ([kv-ttl-cache README](../../kv-ttl-cache/api/README.md)). Article pages (`/a/<slug>`, `/a/id/<id>`) use `website:layout` and their own `website:path:<path>` (looked up in lower case, as the api stores slugs) instead, so only the changed article rebuilds |
| Stale | served once more while one pod rebuilds it (`SET NX` lock holding its start time, 10 s); the others serve it as fresh for 3 s, then rebuild it themselves — Next never rebuilds on a prefetch request, so a lock taken by one would otherwise keep the page old as long as prefetches arrive. A pod whose rebuild stored nothing (the api failed) serves it as fresh for 30 s before it tries again |
| Stored | without the render's `sentry-trace` / `baggage` meta tags, so cached pages do not attach every visitor to one old trace |
| Not found | never stored, an older copy is deleted; 404 and 5xx responses are `private, no-store` (`libs/utils/sentry/error-no-store.ts`) |

Keep the 3 h well above the hour of `revalidate`: once the Dragonfly key is
gone, a pod drops its own stale copy too and renders the page while the visitor
waits — except a page that never reached Dragonfly (over 2 MB, or Dragonfly
failed while it was stored), which stays on its pod.

`revalidateFor(content, errors)` gives article pages, pages and front pages
60 s when they contain an enabled `PollBlock` or `CrowdfundingBlock` anywhere
(teasers included), when the content is missing or the api answered with errors
(a draft or unpublished article answers `INTERNAL_SERVER_ERROR`, not 404), and
an hour otherwise; publishing rebuilds them anyway. Without content and with an
api error that is neither 4xx nor such a hidden article it throws (not during
`next build`), so Next keeps serving the previous page and answers 500 only when
it has none.

Without `REDIS_URL`, during `next build`, in production without `rediss://` and
a readable `NODE_EXTRA_CA_CERTS`, or while Dragonfly fails (1 s timeout, then
5 s pause) the cache works per pod only, and since no publication reaches it
then, no page stays fresh longer than 60 s. The same 60 s apply while
`website:heartbeat` is missing (no api writing versions under this prefix, e.g.
a website deployed before its api).

The handler and its modules are plain CommonJS: Next `import()`s the file at
runtime, unbundled.

Every page lookup is a Sentry span (`page-cache-tracing.js`: `op: cache.get`,
name `website:pages`, `cache.key` = the path, `cache.hit` = an entry came back,
fresh or stale), only inside sampled traces, so the page hit rate shows under
*Insights → Caches* next to the api's.

## Running unit tests

Run `nx test utils-website` to execute the unit tests via Vitest.
The page cache is tested against a fake Dragonfly client; `shared-store.spec.ts`
pins that it only sends commands the production ACL allows, under the prefix.
