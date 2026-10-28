# public-content-cache-api

Caching of published content: the `content:*` namespaces, the anonymous
GraphQL answer cache, `PublicContentCacheInvalidator`, and which resets
rebuild website pages. API only. Built on
[kv-ttl-cache](../../kv-ttl-cache/api/README.md) and
[website-revalidation](../../website-revalidation/api/README.md).

- `PublicContentCacheModule`: imported by the API root only. Registers
  `GraphqlResponseCachePlugin`, the `graphql:responses` cache profile and
  `WebsiteResetListener`. Without it resets silently stop rebuilding website
  pages (pinned by `app.module.boot.spec.ts`).
- `PublicContentInvalidatorModule`: imported by every feature module that
  writes content, for `PublicContentCacheInvalidator`.
- `PUBLIC_CONTENT_SHARED_NAMESPACES`: the `content:*` namespaces and
  `graphql:comments`, part of the API's shared list
  (`apps/api-example/src/nestapp/shared-namespaces.ts`).

## Published content

The article, page, author, image, paywall and poll dataloaders (including
article tags, tracking-pixel rows, paywall member plans and poll vote counts),
`getArticleBySlug`, `getPageBySlug`, `getArticles` and `getPages` (except
full-text search) read through
`content:<articles|pages|authors|images|paywalls|polls>` for 5 min
(`CONTENT_CACHE_TTL_SECONDS`), for every request including logged-in ones:
they cache what the query returns for those arguments, nothing per user.
Writers call `PublicContentCacheInvalidator`:

| Call | Clears | Used by |
| --- | --- | --- |
| `invalidate(...contents)` | those content caches + anonymous answers (`graphql:content`), the answers again 3 s later (another replica may have built one from content that was stale for up to 2 s) | publish, unpublish, delete, updates of published articles/pages; authors, tags, events, paywalls, image updates/deletes, event import; block template/style updates and deletes; `SlateToPmMigrator` after a batch that changed rows |
| `invalidateDraft(...contents)` | only those content caches (plus anonymous answers that select `draft` or `pending`, which are versioned by `content:articles`/`content:pages`) | create, update of unpublished, duplicate, restore, discard; peer import; image upload and a reader's own profile image |
| `invalidateArticlePages(...articles)` | the website pages of those articles (`/a/<slug>`, `/a/id/<id>`) | publish, unpublish, delete and updates of published articles (old and new slug); `ArticlePublicationWatcher` |
| `invalidateComments(removed, ...articles)` | answers containing `commentsForItem` / `ratingSystem` and the pages of those articles; with `removed` also all anonymous answers (comment blocks inside articles/pages) | create (`false`, with the article once an editor publishes it), approve (`false`), edit/reject/delete (`true`); rating system changes; a commenter's name, flair or profile image (`false`), a deleted user's comments (`true`), an editor comment with tags (`true`) |
| `invalidateReaderComments(removed, ...articles)` | like `invalidateComments`, but with `removed` only the anonymous answers, not `website:pages` | a reader's comment approved at once, a reader editing an approved comment (`removed` = it was public before) |
| `invalidateAt(time, ...contents)` | `invalidate(...contents)` at that time (`PublicationTimers`, up to 24 h ahead) | page publish with a future `publishedAt`; an article publish hands its time to `ArticlePublicationWatcher.schedule` instead, which also clears the pages of every article going live |
| `invalidateNavigations()` | cached navigations and their links | article/page delete (links cascade) |
| `invalidateArticleAnswers(...articles)` | all anonymous answers (not `website:pages`) and the pages of those articles | `TrackingPixelService` once a working pixel exists |
| `invalidateArticleLayout()` | `website:layout`, so every article page rebuilds on its next visit | unpublish and delete of articles and pages, block template/style updates and deletes, migrated article revisions |

Anything else calls `NamespaceResets.reset(namespace)` directly.

Scheduled content goes live without a write (views compare `publishedAt` with
`CURRENT_TIMESTAMP`), so `ArticlePublicationWatcher` / `PagePublicationWatcher`
look up publications due in the next 70 s every minute and clear the caches
2 s after each (`PublicationTimers` in `@wepublish/utils/api`).
`EventScheduleWatcher` does the same for events starting or ending.

A like or dislike deletes only that article's `id:`/`slug:` entries, a poll
vote only that poll's `id:` entry (`delNs`); anonymous answers and lists may
show the old count for up to 5 min. Poll edits, answers, external vote sources
and deleted votes call `invalidate('polls')`. Member plan writes call
`invalidate('paywalls')`, payment method writes `invalidate()`; paywall bypasses
are never cached. Other API replicas may serve old content for up to 2 s after
a write.

`commentsForItem` for readers (everyone without `CanGetComments`) reads the
approved comments of an item from `graphql:comments` (`items:<type>:<id>`,
5 min): ratings already counted, only the latest revision, no rating rows, so
rater ids and fingerprints never reach Dragonfly. A logged-in reader's own
comments (every state, fresh) and own ratings come from two small queries on
top. Values and comment answers share the namespace, so one reset retires both;
a comment rating deletes only that item's entry.

`TrackingPixelService.addMissingArticleTrackingPixels` (every `article` query)
remembers per article and provider set that the pixels are complete for 24 h,
retries a failed pixel at most every 15 min, and claims
`tracking-pixels:<articleId>` for 60 s across replicas; a replica that loses the
claim waits up to 3 s for the other one. Errors are logged and never fail the
query.

## GraphQL answers

`GraphqlResponseCachePlugin` answers a repeated query from the
`graphql:responses` profile (`val:<release>:graphql:responses:<sha256>`, 2 s
local copy) for 5 min, or 30 s when the answer contains an enabled `PollBlock`
or `CrowdfundingBlock` (also a `poll`/`crowdfunding` field selected without
`__typename`), when:

- the request carries no login (`Authorization` header, `access_token` in url or
  body), so nothing per user is ever cached; a `preview` header skips the cache
  only with a login;
- every root field is in `CACHEABLE_QUERIES`; `challenge`, `me` and everything
  else unlisted always run. A field joins the list only if its anonymous answer
  is the same for every visitor;
- it is a query, the answer has data and no errors, and no resolver called
  `skipAnswerCache(context)` (hot & trending and teaser lists while Google
  Analytics is down).

Logged-in requests only read answers, and only for `SAME_FOR_EVERYONE_QUERIES`
(`navigations`, `peerProfile`); answers computed for them are never stored.

The key hashes the query, the operation name, the declared variables (sorted)
and the versions of `PAGE_CONTENT_NAMESPACES` (`graphql:content`,
`navigations`, `banners`, `settings`, `website-settings`, `peer-profile`,
`member-plans`, `peering:remote-profiles`), plus `graphql:comments` for
`commentsForItem`/`ratingSystem`, `content:images` for `getImagesByTag` and
`content:articles`/`content:pages` when `draft` or `pending` is selected
(externals may read drafts anonymously). A reset of any of them retires the
answers; one `MGET` reads all stale versions. The names are literals here,
since navigation, peering and member-plan depend on this lib;
`apps/api-example/src/nestapp/shared-namespaces.spec.ts` pins them, and
`WEBSITE_LAYOUT_NAMESPACES`, to the owners' exported constants.

## Website pages

`WebsiteResetListener` registers with `NamespaceResets`:

| Reset of | Signal |
| --- | --- |
| a namespace in `PAGE_CONTENT_NAMESPACES` | `WebsitePagesSignal.recordChange()` |
| a namespace in `WEBSITE_LAYOUT_NAMESPACES` (the above without `graphql:content`, plus `content:paywalls`) | `WebsiteLayoutSignal.changed()` |

`reset(ns, {silent: true})` skips the listener (`invalidateArticleAnswers`,
`invalidateReaderComments`). Drafts (`content:*` except paywalls), sessions
and readers' comments leave the pages alone. Article pages ignore
`website:pages` and follow `website:layout` and their own path version. Anything
else an article page shows (related articles, hot & trending, teasers) waits
for its `revalidate`; the comment list's first query is `cache-first`, so a
moderator decision has to rebuild the page.

```bash
pnpm nx test public-content-cache-api
```
