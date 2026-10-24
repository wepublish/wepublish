# We.Publish: the draft / pending / published revision system

Scope: everything the new event entity has to adopt from We.Publish's existing revision and
publication machinery. This document describes the Prisma models (`Article`, `ArticleRevision`,
`Page`, `PageRevision`, their child tables and the six SQL views), the exact view bodies as they
exist in the migrations, the full contents of `libs/article/api` and `libs/page/api`, every
mutation that moves an entity between states, how scheduled ("pending") publication is actually
executed, how the website is restricted to published content, how the editor renders the three
states, and a file-by-file recipe for making a new entity revisioned the same way. The last three
sections answer the two questions the decision log parked here: where a per-draft field such as
`reviewRequestedAt` belongs ([D5](../decisions.md#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event)),
and whether occurrence expansion belongs to the revision or to the entity. Everything is grounded
in file paths and line numbers; the We.Publish database is stopped, so all statements about the
schema come from `libs/api/prisma/schema.prisma` and the SQL in `libs/api/prisma/migrations`.

---

## 1. The data model

### 1.1 Shape at a glance

```
articles  (the identity: id, slug, publishedAt, hidden, shared, likes, tags, paywall, peer)
   │
   │ 1:n  articles.revisions.articleId  (ON DELETE CASCADE)
   ▼
articles.revisions  (the content: title, lead, blocks JSONB, properties JSONB, image, …
                     plus the two state columns publishedAt and archivedAt)
   │
   ├─ 1:n articles.revisions.author              (authorId, role, position)
   └─ 1:n articles.revisions.social-media-author (authorId)

three SQL VIEWs over articles.revisions, one row per article each:
   articles.revisions.published   → the revision the public sees
   articles.revisions.pending     → the revision scheduled for the future
   articles.revisions.draft       → the revision being edited
```

The entity row carries identity, routing and anything a list query must filter or sort on. The
revision row carries content. There is **no** `draftId` / `pendingId` / `publishedId` column
anywhere — those were dropped in November 2024 (see §1.8). Which revision is "the published one"
is *derived*, by the views, from `publishedAt` / `archivedAt` and the clock.

### 1.2 `Article` — full definition

`libs/api/prisma/schema.prisma:106-140`

```prisma
model Article {
  id          String    @id @default(dbgenerated("gen_random_uuid()"))
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)
  modifiedAt  DateTime  @updatedAt @db.Timestamptz(3)
  publishedAt DateTime? @db.Timestamptz(3)

  slug            String?
  shared          Boolean
  hidden          Boolean @default(false)
  disableComments Boolean @default(false)
  likes           Int     @default(0)

  peer          Peer?   @relation(fields: [peerId], references: [id], onDelete: Restrict)
  peerId        String?
  peerArticleId String?

  paywall   Paywall? @relation(fields: [paywallId], references: [id], onDelete: SetNull)
  paywallId String?  @db.Uuid

  navigations              NavigationLink[]
  tags                     TaggedArticles[]
  revisions                ArticleRevision[]
  trackingPixels           ArticleTrackingPixels[]
  ArticleRevisionPublished ArticleRevisionPublished?
  ArticleRevisionPending   ArticleRevisionPending?
  ArticleRevisionDraft     ArticleRevisionDraft?

  @@index([createdAt])
  @@index([modifiedAt])
  @@index([publishedAt])
  @@index([slug])
  @@index([slug(ops: raw("gin_trgm_ops"))], type: Gin, map: "articles_slug_trgm_idx")
  @@index([hidden, publishedAt(sort: Desc)])
  @@map("articles")
}
```

`Article.publishedAt` is **not** "when the current revision went live". It is the *first*
publication instant, pulled backwards when you publish earlier than before — see
`publishArticle` in §2.3. Two extra database objects are not expressible in Prisma and live only
in SQL:

| Object | SQL | Migration |
| --- | --- | --- |
| Partial unique slug | `CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug") WHERE ("publishedAt" is NOT null);` | `20241126132733_migrate_articles_and_pages_to_leave_revision_history/migration.sql:67` |
| Lowercase check | `ALTER TABLE "articles" ADD CONSTRAINT "articles_slug_lowercase_check" CHECK (slug = LOWER(slug));` | `20260925120000_lowercase_article_and_page_slugs/migration.sql:17` |

Same two for pages (`pages_slug_key`, migration line 183); pages have no lowercase check.
**Slugs are unique only among published rows.** Any number of unpublished articles may share a
slug, which is why `loadArticleBySlug` orders by `publishedAt: 'asc'`
(`libs/article/api/src/lib/article.service.ts:65-74`).

### 1.3 `ArticleRevision` — full definition

`libs/api/prisma/schema.prisma:10-49`

```prisma
model ArticleRevision {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  preTitle               String?
  title                  String?
  lead                   String?
  seoTitle               String?
  seoDescription         String?
  canonicalUrl           String?
  properties             Json                               @default("[]")
  authors                ArticleRevisionAuthor[]
  breaking               Boolean
  blocks                 Json
  hideAuthor             Boolean
  socialMediaTitle       String?
  socialMediaDescription String?
  socialMediaAuthors     ArticleRevisionSocialMediaAuthor[]
  publishedAt            DateTime?                          @db.Timestamptz(3)
  archivedAt             DateTime?                          @db.Timestamptz(3)

  image   Image?  @relation("articleRevisionImage", fields: [imageID], references: [id])
  imageID String?

  socialMediaImage   Image?  @relation("articleRevisionSocialMediaImage", fields: [socialMediaImageID], references: [id])
  socialMediaImageID String?

  articleId String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  userId                   String?
  user                     User?                      @relation(fields: [userId], references: [id], onDelete: SetNull)
  ArticleRevisionPublished ArticleRevisionPublished[]
  ArticleRevisionPending   ArticleRevisionPending[]
  ArticleRevisionDraft     ArticleRevisionDraft[]

  @@index([publishedAt])
  @@index([articleId, createdAt(sort: Desc), id(sort: Desc)])
  @@map("articles.revisions")
}
```

The only two state columns are `publishedAt` and `archivedAt`. There is no `state` enum, no
`revision` sequence number (dropped in 2024), and no `modifiedAt` — a revision is immutable
content plus two mutable timestamps.

| Column combination | Meaning |
| --- | --- |
| `publishedAt IS NULL`, `archivedAt IS NULL` | an open draft |
| `publishedAt IS NULL`, `archivedAt NOT NULL` | superseded draft / discarded draft; kept for history |
| `publishedAt <= now`, `archivedAt IS NULL` | live |
| `publishedAt > now`, `archivedAt IS NULL` | scheduled (pending) |
| `publishedAt NOT NULL`, `archivedAt NOT NULL` | in theory unreachable — see the warning in §2.8 |

### 1.4 Revision child tables

`libs/api/prisma/schema.prisma:81-104`

```prisma
model ArticleRevisionAuthor {
  revision   ArticleRevision @relation(fields: [revisionId], references: [id], onDelete: Cascade)
  revisionId String
  author     Author          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId   String
  role       String?
  position   Int     @default(0)

  @@id([revisionId, authorId])
  @@map("articles.revisions.author")
}

model ArticleRevisionSocialMediaAuthor {
  revision   ArticleRevision @relation(fields: [revisionId], references: [id], onDelete: Cascade)
  revisionId String
  author     Author          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId   String

  @@id([revisionId, authorId])
  @@map("articles.revisions.social-media-author")
}
```

These are the **only** surviving per-revision child tables, and they are tiny (a handful of rows
per revision). Everything else that used to be a child table was collapsed into JSONB on the
revision — `properties` moved from a `properties` table into `articles.revisions.properties`
(`20260505224002_move_focalpoint_and_properties_to_same_table/migration.sql:24,36-52,120`). Keep
that direction in mind for §11.

### 1.5 `Page` and `PageRevision`

`libs/api/prisma/schema.prisma:832-892`. Structurally identical, minus the article-only fields
(`breaking`, `hideAuthor`, `canonicalUrl`, authors, peering, paywall, tracking pixels, likes):

```prisma
model PageRevision {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  publishedAt            DateTime? @db.Timestamptz(3)
  archivedAt             DateTime? @db.Timestamptz(3)
  title                  String?
  description            String?
  seoTitle               String?
  seoDescription         String?
  properties             Json      @default("[]")
  socialMediaTitle       String?
  socialMediaDescription String?
  blocks                 Json

  imageID String?
  image   Image?  @relation("pageRevisionImage", fields: [imageID], references: [id])

  socialMediaImageID String?
  socialMediaImage   Image?  @relation("pageRevisionSocialMediaImage", fields: [socialMediaImageID], references: [id])

  pageId String
  page   Page   @relation(fields: [pageId], references: [id], onDelete: Cascade)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  …
  @@index([publishedAt])
  @@index([pageId, createdAt(sort: Desc), id(sort: Desc)])
  @@map("pages.revisions")
}

model Page {
  id          String    @id @default(dbgenerated("gen_random_uuid()"))
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)
  modifiedAt  DateTime  @updatedAt @db.Timestamptz(3)
  publishedAt DateTime? @db.Timestamptz(3)

  slug   String?
  hidden Boolean @default(false)
  …
  @@map("pages")
}
```

Note the naming inconsistency to **not** copy: the article views are modelled as
`ArticleRevisionPublished`, the page views as `Pages`RevisionPublished (plural). For events, pick
one — `EventRevisionPublished` matches the article side.

### 1.6 The three views — exact bodies and why they exist

Prisma blocks (`libs/api/prisma/schema.prisma:51-79` and `906-934`). All six are the same three
columns-wide shape:

```prisma
view ArticleRevisionPublished {
  id              String          @unique
  articleRevision ArticleRevision @relation(fields: [id], references: [id])

  articleId String  @unique
  article   Article @relation(fields: [articleId], references: [id])

  @@map("articles.revisions.published")
}
```

…and identically `ArticleRevisionPending` (`articles.revisions.pending`),
`ArticleRevisionDraft` (`articles.revisions.draft`), `PagesRevisionPublished`,
`PagesRevisionPending`, `PagesRevisionDraft`.

The view exposes **only** `(id, articleId)`. It is a pointer, not a projection: any revision
column you want has to be reached through the `articleRevision` relation.

The SQL lives in `libs/api/prisma/migrations/20250820145935_add_article_and_page_revisions_published_draft_pending_view/migration.sql`:

```sql
/** VIEWS for articles **/

CREATE VIEW "articles.revisions.published" AS
    SELECT DISTINCT ON ("articleId")
        id,
        "articleId"
        FROM
        "articles.revisions"
        WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY
     "articleId", "createdAt" DESC, id DESC
;
CREATE INDEX article_revisions_published_by_article_created_id_desc
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;

CREATE VIEW "articles.revisions.pending" AS
    SELECT DISTINCT ON ("articleId")
        id,
        "articleId"
    FROM
        "articles.revisions"
    WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
    ORDER BY
        "articleId", "createdAt" DESC, id DESC
;

CREATE INDEX article_revisions_pending_by_article_created
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;


CREATE VIEW "articles.revisions.draft" AS
    SELECT DISTINCT ON ("articleId")
        id,
        "articleId"
    FROM
        "articles.revisions"
    WHERE
        "archivedAt" IS NULL AND "publishedAt" is NULL
    ORDER BY
        "articleId", "createdAt" DESC, id DESC
;

CREATE INDEX article_revisions_draft_by_article_created
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;
```

The page half of the same file is the same three statements over `"pages.revisions"` / `"pageId"`,
with indexes `page_revisions_published_by_page_created_id_desc`,
`page_revisions_pending_by_page_created`, `page_revisions_draft_by_page_created`. (Each page view
has a stray double `;` at the end — harmless.)

**Why the views exist.** Four reasons, all visible in the code:

1. **One row per entity, chosen deterministically.** `DISTINCT ON ("articleId") … ORDER BY
   "articleId", "createdAt" DESC, id DESC` gives exactly one revision per article, with `id DESC`
   as a tiebreaker for revisions created in the same millisecond. Without the view every caller
   would re-implement that ordering.
2. **`@unique` on `articleId` turns it into a 1:1 relation in Prisma**, so `Article` can
   `include: { ArticleRevisionPublished: { include: { articleRevision: true } } }` and get a
   single object back rather than an array — see §4.2.
3. **It makes the state filterable from the entity side.** `createTitleFilter` and friends
   (`libs/article/api/src/lib/article.service.ts:853-977, 1129-1224`) filter on
   `ArticleRevisionPublished: { articleRevision: { title: { contains … } } }`, i.e. "the title of
   the *currently published* revision", which is impossible to express with `revisions: { some: … }`.
4. **Publication becomes a function of the clock, not of a job.** `publishedAt <= CURRENT_TIMESTAMP`
   is evaluated at query time, so a scheduled revision becomes the published one the instant the
   clock passes it, with nothing running. This is the single most important design fact in this
   document — see §3.

**Views are hand-written SQL, not generated.** Every `CREATE VIEW` in the repo is in a
hand-written migration; `prisma migrate` emits none. The `views` preview feature
(`schema.prisma:3`, `previewFeatures = ["views", "relationJoins"]`) only lets the `view` block
exist in the schema and generate a client type.

**The views are re-created whenever the underlying columns change type.**
`20260817121431_add_timezones_to_dates/migration.sql` opens with

```sql
DROP VIEW IF EXISTS "articles.revisions.published";
DROP VIEW IF EXISTS "articles.revisions.pending";
DROP VIEW IF EXISTS "articles.revisions.draft";
DROP VIEW IF EXISTS "pages.revisions.published";
DROP VIEW IF EXISTS "pages.revisions.pending";
DROP VIEW IF EXISTS "pages.revisions.draft";
```

…because PostgreSQL refuses `ALTER TABLE … ALTER COLUMN "publishedAt" SET DATA TYPE TIMESTAMPTZ(3)`
while a view depends on the column (lines 33, 192). The six `CREATE VIEW` statements are then
repeated verbatim at lines 372-438, with a comment pointing back at the original migration. The
partial indexes are *not* repeated — `DROP VIEW` does not touch table indexes.

### 1.7 Index inventory for the revision tables

| Index | Where defined | Purpose |
| --- | --- | --- |
| `articles.revisions_publishedAt_idx` | `@@index([publishedAt])`, schema:46 | the publication watcher's window query |
| `articles.revisions_articleId_createdAt_id_idx` | `@@index([articleId, createdAt(sort: Desc), id(sort: Desc)])`, schema:47 | `getArticleRevisions` paging, `revisions: { take: 1, orderBy: createdAt desc }` |
| `article_revisions_published_by_article_created_id_desc` | raw SQL, partial `WHERE "publishedAt" IS NOT NULL`, `INCLUDE ("publishedAt")` | the published view's `DISTINCT ON` |
| `article_revisions_pending_by_article_created` | raw SQL, same predicate | the pending view (a duplicate of the previous one — same columns, same predicate) |
| `article_revisions_draft_by_article_created` | raw SQL, partial `WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL` | the draft view |
| same five for `pages.revisions` | — | — |

There is **no index on `articles.revisions.userId`**, even though `getArticleRevisions` filters on
it (`article.service.ts:552-555`).

### 1.8 Entity vs revision: what lives where, and the history of moving things

| Field | Lives on | Note |
| --- | --- | --- |
| `slug` | entity | **moved off the revision** in Nov 2024 |
| `likes` | entity | **moved off the revision** in Nov 2024 |
| `tags` | entity (`TaggedArticles` join) | **moved off the revision** in May 2024 (was a `text[]` column) |
| `hidden`, `shared`, `disableComments` | entity | never on the revision |
| `paywallId`, `peerId`, `peerArticleId` | entity | |
| `publishedAt` (first publication) | entity | plus a per-revision `publishedAt` with different semantics |
| `createdAt`, `modifiedAt` | entity | revision has only `createdAt` |
| `title`, `preTitle`, `lead`, `seoTitle`, `seoDescription`, `canonicalUrl`, `socialMedia*`, `breaking`, `hideAuthor`, `blocks`, `properties`, `imageID`, `socialMediaImageID` | revision | |
| `authors`, `socialMediaAuthors` | revision (child tables) | copied row-by-row on every new revision |
| `userId` (who wrote this version) | revision | |
| `trackingPixels` | entity | |

The two migrations that moved fields are worth reading in full before deciding where a new field
goes, because they are the precedent:

* `20240513152239_migrate_revision_tags/migration.sql` — tags were a `text[]` on the revision;
  they became `tags` + `articles.tagged-articles` hanging off the *entity*, so list queries could
  filter by tag with an index instead of unnesting an array on whichever revision was current.
* `20241126132733_migrate_articles_and_pages_to_leave_revision_history/migration.sql` — the big
  one. It dropped `articles.draftId/pendingId/publishedId`, added `articles.revisions.articleId`
  (so revisions hang off the article instead of the reverse), added `articles.publishedAt`,
  `articles.slug` and `articles.likes`, deduplicated slugs across revisions, and dropped
  `articles.revisions.{modifiedAt,publishAt,revision,tags,updatedAt,slug,likes}`.

  ```sql
  -- Fix duplicate slugs
  WITH DuplicateSlugs AS (
      SELECT id, slug,
             ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "publishedAt") AS rn
      FROM "articles.revisions"
      WHERE "publishedAt" IS NOT NULL
  )
  UPDATE "articles.revisions"
  SET slug = CONCAT("articles.revisions".slug, '-', rn)
  FROM DuplicateSlugs ds
  WHERE "articles.revisions".id = ds.id AND ds.rn > 1;
  ```

  The direction of travel is unambiguous: **anything a list query touches gets pulled out of the
  revision and onto the entity.**

---

## 2. The lifecycle state machine

### 2.1 States

There is no state column. A state is a predicate over `(publishedAt, archivedAt, now())`, and
the three views name three of the combinations. The GraphQL surface exposes four fields on the
entity: `draft`, `pending`, `published` (each a view lookup) and `latest` (a computed pick).

```
                    createArticle
                         │
                         ▼
                   ┌──────────┐   updateArticle / restoreArticleRevision
                   │  DRAFT   │◀──────────────── (archives the old draft,
                   └──────────┘                   creates a new one)
                     │      ▲
   publishArticle    │      │  discardArticleDraft  (archives the draft;
   (publishedAt ≤ now)│     │   requires a published fallback)
                     │      │
                     ▼      │
                ┌───────────────┐
                │   PUBLISHED   │────── unpublishArticle ──▶ newest revision
                └───────────────┘                            becomes DRAFT again
                     ▲
   publishArticle    │  the clock passes publishedAt
   (publishedAt > now)│  (no code runs — the view flips)
                     │
                ┌───────────────┐
                │    PENDING    │
                └───────────────┘
                     ▲
                     └── publishArticle again (future date) supersedes the
                         previous pending revision: publishedAt := NULL,
                         archivedAt := now
```

### 2.2 Every mutation, with its guard and its effect

Resolver: `libs/article/api/src/lib/article.resolver.ts`; service:
`libs/article/api/src/lib/article.service.ts`. Page equivalents are one-for-one unless noted.

| Mutation | Resolver line | Permission | Service | Effect on revisions |
| --- | --- | --- | --- | --- |
| `createArticle` | 133-142 | `CanCreateArticle` | `article.service.ts:142` | creates the article **and** its first revision in one nested `create` |
| `updateArticle` | 144-153 | `CanCreateArticle` | `:213` | `updateMany { archivedAt: null, publishedAt: null } → archivedAt = now`, then `create` a new revision |
| `duplicateArticle` | 155-164 | `CanCreateArticle` | `:457` | new article + copy of the **newest** revision (identity fields stripped) |
| `deleteArticle` | 166-172 | `CanDeleteArticle` | `:306` | row delete; revisions cascade |
| `publishArticle(id, publishedAt)` | 174-183 | `CanPublishArticle` | `:329` | archives pending revisions, stamps `publishedAt` on the newest revision, recomputes `article.publishedAt` |
| `unpublishArticle` | 185-191 | `CanPublishArticle` | `:398` | `article.publishedAt = null`; all published revisions → `publishedAt = null, archivedAt = now`; newest revision un-archived so it becomes the draft |
| `discardArticleDraft` | 193-199 | `CanCreateArticle` | `:680` | archives the open draft; refuses if there is no published fallback |
| `restoreArticleRevision(id, revisionId)` | 201-215 | `CanCreateArticle` | `:603` | archives the open draft, clones the chosen revision into a new draft |
| `likeArticle` / `dislikeArticle` | 217-231 | `@Public()` | `:733` / `:750` | entity-only (`likes` counter); targeted cache delete, no revision touched |

Page-only differences: there is no like/dislike and no duplicate-with-authors; `duplicatePage`
(`page.service.ts:368`) copies no child rows at all.

Note that **`updateArticle` is guarded by `CanCreateArticle`, not by a separate update
permission** — the repo has no `CanUpdateArticle`.

### 2.3 `publishArticle` in detail

`libs/article/api/src/lib/article.service.ts:329-395`

```ts
@PrimeDataLoader(ArticleDataloaderService)
async publishArticle(id: string, publishedAt: Date) {
  const article = await this.prisma.article.findUnique({
    where: { id },
    include: { revisions: { take: 1, orderBy: { createdAt: 'desc' } } },
  });

  if (!article?.revisions?.[0]) {
    throw new NotFoundException(`Article with id ${id} not found`);
  }

  // Unpublish existing pending revisions
  await this.prisma.articleRevision.updateMany({
    data: { publishedAt: null, archivedAt: new Date() },
    where: { articleId: id, publishedAt: { gte: new Date() } },
  });

  const articlePublishedAtInTheFuture =
    article.publishedAt && article.publishedAt > new Date();
  const newPublishedAtEarlier =
    article.publishedAt && article.publishedAt > publishedAt;

  const articlePublishedAt =
    articlePublishedAtInTheFuture || newPublishedAtEarlier ? publishedAt : (
      (article.publishedAt ?? publishedAt)
    );

  const published = await this.prisma.article.update({
    where: { id },
    data: {
      publishedAt: articlePublishedAt,
      modifiedAt: new Date(),
      revisions: {
        update: { where: { id: article.revisions[0].id }, data: { publishedAt } },
      },
    },
  });
  await this.publicContentCache.invalidate('articles');
  await this.publicContentCache.invalidateArticlePages(article);
  this.publicationWatcher.schedule(publishedAt);
  this.publicationWatcher.schedule(articlePublishedAt);

  return published;
}
```

Five things to carry over:

1. **Publishing mutates the draft row in place.** It does not copy the draft into a new
   "published" revision. The row that was the draft becomes the published row, and it drops out of
   the draft view purely because `publishedAt` is no longer NULL.
2. **It publishes `revisions[0]`, the newest by `createdAt`**, whatever its state. If there is no
   draft, re-publishing just moves the live revision's `publishedAt`.
3. **`article.publishedAt` is the earliest publication**: it is only moved backwards (when the new
   date is earlier, or when the stored one is still in the future). Pinned by four tests,
   `article.service.spec.ts:498-557`.
4. **A new publish supersedes a pending one** by nulling `publishedAt` and setting `archivedAt` on
   every revision with `publishedAt >= now` (test at `:558-573`).
5. **Two cache clears are scheduled**, for the revision's `publishedAt` and the entity's.

`publishPage` (`page.service.ts:242-308`) is identical except it has no watcher injected and calls
`this.publicContentCache.invalidateAt(publishedAt, 'pages')` directly.

### 2.4 `unpublishArticle`

`article.service.ts:397-452`. One `update` that nulls `article.publishedAt` and sets every
published revision to `publishedAt: null, archivedAt: now`, then a second statement:

```ts
if (updatedArticle.revisions[0]) {
  // Latest revision should not be archived
  await this.prisma.articleRevision.update({
    where: { id: updatedArticle.revisions[0].id },
    data: { archivedAt: null },
  });
}
```

So unpublishing leaves the article with exactly one open draft — the content that was live.

### 2.5 `updateArticle` — the archive-then-create pattern

`article.service.ts:212-304`. The revision half of the nested write:

```ts
revisions: {
  updateMany: {
    where: { archivedAt: null, publishedAt: null },
    data: { archivedAt: new Date() },
  },
  create: {
    ...revision,
    blocks: mappedBlocks as any[],
    userId,
    properties: properties as any,
    authors:            { createMany: { data: mapArticleRevisionAuthors(authors) } },
    socialMediaAuthors: { createMany: { data: socialMediaAuthorIds.map(authorId => ({ authorId })) } },
  },
},
```

**Every save creates a revision row.** There is no "update the open draft in place" path. Because
the editor autosaves every 30 s (`apps/editor/src/app/useAutosave.ts:3`,
`AUTOSAVE_INTERVAL_MS = 30_000`) using the *same* `UpdateArticle` mutation
(`apps/editor/src/app/routes/articles/articleEditor.tsx:155-156`), an hour of editing produces
roughly 120 revision rows, each with a full copy of `blocks`, `properties` and the author child
rows. Nothing prunes them: no cron, no retention job, no `deleteMany` on either revision table
anywhere in the repo.

The published revision is untouched by this, because the `updateMany` predicate requires
`publishedAt: null`. That is how a published article stays live while being edited.

### 2.6 `restoreArticleRevision`

`article.service.ts:596-677`. Loads the chosen revision with its authors, destructures away the
identity and state columns, archives the open draft, creates a new draft from the rest:

```ts
const {
  id: _id, createdAt: _createdAt, publishedAt: _publishedAt, archivedAt: _archivedAt,
  userId: _userId, articleId: _articleId,
  properties, authors, socialMediaAuthors,
  ...content
} = revision;
```

**This spread is the trap for any new revision column.** Six columns are explicitly dropped;
everything else is copied verbatim into the new draft. A `reviewRequestedAt` on the revision would
be silently carried into a restored draft unless it is added to that destructuring — and to the
equivalent one in `duplicateArticle` (`:478-490`, which drops only five columns and keeps
`archivedAt`), `duplicatePage` (`:387-395`, drops four) and `restorePageRevision` (`:574-583`).

### 2.7 `discardArticleDraft`

`article.service.ts:679-731`. Archives the open draft; throws `BadRequestException` if there is no
draft, and again if there is no non-archived published revision to fall back to — otherwise the
article would be left with no `latest` at all.

### 2.8 A latent coupling worth naming

The **published and pending views ignore `archivedAt`**. `"publishedAt" IS NOT NULL AND
"publishedAt" <= CURRENT_TIMESTAMP` alone would match an archived-but-once-published revision. It
is safe today only because every path that sets `archivedAt` also nulls `publishedAt`
(`publishArticle`'s pending sweep, `unpublishArticle`). A new mutation that archives a published
revision without nulling `publishedAt` would resurrect it in the published view. If you copy the
views for events, consider adding `AND "archivedAt" IS NULL` to the published and pending bodies —
it is a strictly safer predicate and costs nothing.

---

## 3. How "pending" is actually executed

**Nothing publishes a pending revision.** There is no cron, no queue, no `PeriodicJob` entry, no
`@Cron` decorator anywhere near articles or pages (the only `@Cron` in the repo is
`libs/audit-log/api/src/lib/audit-log-retention.service.ts:36`). Publication *happens* because
the view's predicate is evaluated against `CURRENT_TIMESTAMP` at query time. At 09:59:59 the
revision is in `articles.revisions.pending`; at 10:00:01 the identical row is in
`articles.revisions.published`. No write occurs.

What *does* run on a timer is **cache invalidation**, because the GraphQL response cache and the
KV content cache would otherwise keep serving the pre-publication answer for up to five minutes
(`CONTENT_CACHE_TTL_SECONDS = 300`, `graphql-response-cache.plugin.ts:40`).

### 3.1 `ArticlePublicationWatcher`

`libs/article/api/src/lib/article-publication.watcher.ts` — 99 lines, reproduced in full because
it is the exact template an event watcher needs:

```ts
const LOOKAHEAD_MS = 70_000;
const LONGEST_SCHEDULE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ArticlePublicationWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private logger = new Logger('ArticlePublicationWatcher');
  private timers = new PublicationTimers();
  private coveredUntil?: Date;

  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  onApplicationBootstrap() { return this.scheduleUpcoming(); }
  onModuleDestroy()        { this.timers.clear(); }

  schedule(publishedAt: Date) {
    const wait = publishedAt.getTime() - Date.now();
    if (wait <= 0 || wait > LONGEST_SCHEDULE_MS) { return; }
    this.timers.schedule([publishedAt], () => this.publish(publishedAt));
  }

  @Interval(60_000)
  async scheduleUpcoming() {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const from =
      this.coveredUntil && this.coveredUntil < now ? this.coveredUntil : now;
    const where = { publishedAt: { gt: from, lte: until } };

    try {
      const upcoming = await Promise.all([
        this.prisma.article.findMany({ where, select: { publishedAt: true } }),
        this.prisma.articleRevision.findMany({ where, select: { publishedAt: true } }),
      ]);

      for (const { publishedAt } of upcoming.flat()) {
        if (publishedAt) {
          this.timers.schedule([publishedAt], () => this.publish(publishedAt));
        }
      }

      this.coveredUntil = until;
    } catch (error) { … }
  }

  private async publish(publishedAt: Date) {
    const [articles, revisions] = await Promise.all([
      this.prisma.article.findMany({
        where: { publishedAt }, select: { id: true, slug: true },
      }),
      this.prisma.articleRevision.findMany({
        where: { publishedAt }, select: { article: { select: { id: true, slug: true } } },
      }),
    ]);

    await this.publicContentCache.invalidate('articles');
    await this.publicContentCache.invalidateArticlePages(
      ...articles, ...revisions.map(({ article }) => article)
    );
  }
}
```

Mechanics:

| Piece | What it does |
| --- | --- |
| `@Interval(60_000)` | polls once a minute (needs `ScheduleModule.forRoot()`, registered once at `apps/api-example/src/nestapp/app.module.ts:301`) |
| `LOOKAHEAD_MS = 70_000` | the window is 70 s wide against a 60 s poll — a 10 s overlap so nothing falls between two polls |
| `coveredUntil` | if the process stalled, the next poll starts from the end of the last covered window instead of `now`, so a missed minute is still picked up |
| `PublicationTimers` | `libs/kv-ttl-cache/api/src/lib/publication-timers.ts` — a `Map<epochMs, Timeout>` that de-duplicates by instant, fires at `at - now + 2000` ms (`CLOCK_DRIFT_MS = 2000`) and calls `timer.unref?.()` so it never holds the process open |
| `schedule(publishedAt)` (public) | called synchronously by `publishArticle` so a publication within the next 24 h is armed immediately, without waiting for the next poll |
| `publish(at)` | resets the `content:articles` namespace and the whole public GraphQL response cache, then tells the Next.js sites which `/a/<slug>` and `/a/id/<id>` paths changed |

`PagePublicationWatcher` (`libs/page/api/src/lib/page-publication.watcher.ts`) is the same thing
minus `schedule()`, minus `LONGEST_SCHEDULE_MS`, and with a single
`this.publicContentCache.invalidate('pages')` callback — it does not invalidate per-path website
caches. `PageService` instead calls `publicContentCache.invalidateAt(publishedAt, 'pages')`
(`page.service.ts:302-304`), which keeps its own `Map<contents, PublicationTimers>` inside
`PublicContentCacheInvalidator` (`graphql-response-cache.plugin.ts:237-259`).

`EventScheduleWatcher` (`libs/event/api/src/lib/event-schedule.watcher.ts`) already exists and uses
the same pattern, but keyed on `startsAt`/`endsAt` rather than on a publication date — it exists so
that an event dropping out of "upcoming" clears the cache.

### 3.2 Consequences of clock-driven publication

* **Horizontal scaling is free.** Every pod computes the same answer from the same clock; the
  timers only clear caches, and clearing twice is harmless.
* **A missed timer degrades to staleness, not to a missed publication.** Worst case the content
  appears up to `CONTENT_CACHE_TTL_SECONDS` (300 s) late.
* **There is no "publication failed" state** and nothing to retry, because nothing runs.
* **Side effects at publication time are impossible with this design.** If publishing an event
  must send a mail (D3's `eventPublished`), that mail has to be sent by the *mutation*, not by the
  clock. A pending event that goes live at 03:00 will not trigger anything. This is a real
  constraint on the D3 notification work: either notify at `publishEvent` call time ("will be
  published on …"), or add a real job for the pending case. Articles and pages have no such
  requirement today, so there is no precedent to copy.

---

## 4. Service-layer patterns

### 4.1 `@PrimeDataLoader` and `Primeable`

`libs/utils/api/src/lib/dataloader/prime-dataloaders.decorator.ts`:

```ts
export interface Primeable<T> {
  prime: DataLoader<string, T | null>['prime'];
  load: DataLoader<string, T | null>['load'];
  loadMany: DataLoader<string, T | null>['loadMany'];
}

export function PrimeDataLoader<T extends Primeable<unknown>>(
  dataloader: Type<T>,
  primeKey = 'id'
) {
  const decoratorFactory = (target, propertyKey, descriptor) => {
    const origin = descriptor.value;
    const injectProperty = `__DATALOADER__${dataloader.name}`;
    Inject(dataloader)(target, injectProperty);

    descriptor.value = async function (...args) {
      const resultItem = await origin.apply(this, args);
      if (!resultItem) return resultItem;

      const results =
        Array.isArray(resultItem)       ? resultItem.flat()
        : Array.isArray(resultItem.nodes) ? resultItem.nodes
        : [resultItem];

      for (const result of results) {
        if (primeKey in result) {
          (this as any)[injectProperty].prime(result[primeKey], result);
        }
      }
      return resultItem;
    };
  };
  decoratorFactory.KEY = `PrimeDataLoader_${dataloader.name}`;
  return decoratorFactory;
}
```

It wraps a service method, injects the dataloader as a hidden property, and primes the loader with
every returned row (handling a single object, an array, or a `{ nodes }` page). Applied to every
article/page service method that returns entities:
`getArticleBySlug`, `getArticles`, `createArticle`, `updateArticle`, `publishArticle`,
`unpublishArticle`, `duplicateArticle`, `restoreArticleRevision`, `discardArticleDraft`,
`likeArticle`, `dislikeArticle` (lines 55, 76, 141, 212, 328, 397, 456, 602, 679, 732, 749). It is
**not** applied to `getArticleRevisions` or `getRevisionById`, which return revisions rather than
articles.

Side effect worth knowing when writing specs: the decorator expects
`this.__DATALOADER__ArticleDataloaderService` to exist, which is why
`article-content-cache.spec.ts:36-37` hand-assigns
`{ __DATALOADER__ArticleDataloaderService: { prime: vi.fn() } }` onto a manually constructed
service.

### 4.2 The two dataloaders

**Entity loader** — `libs/article/api/src/lib/article-dataloader.service.ts`, request-scoped,
batches by id and caches each row in KV under namespace `content:articles`, key prefix `id:`:

```ts
@Injectable({ scope: Scope.REQUEST })
export class ArticleDataloaderService implements Primeable<Article> {
  private dataloader = new DataLoader<string, Article | null>(
    async (ids: readonly string[]) =>
      this.kv.getOrLoadManyNs(
        contentCacheNamespace('articles'),
        ids as string[],
        async missing =>
          createOptionalsArray(
            missing,
            await this.prisma.article.findMany({ where: { id: { in: missing } } }),
            'id'
          ),
        CONTENT_CACHE_TTL_SECONDS,
        'id:'
      ),
    { name: 'ArticleDataLoader' }
  );
  …
}
```

**Revision loader** — `libs/article/api/src/lib/article-revision-dataloader.service.ts`. Batches
by *article* id and returns a `{ draft, pending, published }` map, loaded through the three views
in a single query:

```ts
type RevisionMap = Partial<{
  draft: ArticleRevision; pending: ArticleRevision; published: ArticleRevision;
}>;

private async loadRevisions(articleIds: string[]): Promise<RevisionMap[]> {
  const articles = await this.prisma.article.findMany({
    relationLoadStrategy: 'join',
    where: { id: { in: articleIds } },
    include: {
      ArticleRevisionPublished: { include: { articleRevision: true } },
      ArticleRevisionDraft:     { include: { articleRevision: true } },
      ArticleRevisionPending:   { include: { articleRevision: true } },
    },
  });

  return articleIds.map((articleId): RevisionMap => {
    const rev = articles.find(rev => rev.id === articleId);
    return {
      draft:     rev?.ArticleRevisionDraft?.articleRevision,
      pending:   rev?.ArticleRevisionPending?.articleRevision,
      published: rev?.ArticleRevisionPublished?.articleRevision,
    };
  });
}
```

Cached under the same namespace with prefix `revisions:`. `relationLoadStrategy: 'join'` (the
`relationJoins` preview feature) makes Prisma emit one SQL statement with lateral joins instead of
four round-trips. The page loader (`page-revision-dataloader.service.ts:38-72`) is identical but
**omits** `relationLoadStrategy: 'join'` — an inconsistency, not a deliberate choice as far as the
code shows.

Both loaders are `Scope.REQUEST`, so the per-request `DataLoader` memoisation is per request, while
the KV layer is cross-request and cross-pod. `article-content-cache.spec.ts:77-98` pins exactly
that: two freshly constructed loaders in two "requests" hit Prisma once.

### 4.3 Cache namespaces and invalidation

Namespaces (`libs/kv-ttl-cache/api/src/lib/kv-ttl-cache-shared-namespaces.ts:21-40`) include
`content:articles` and `content:pages`; `contentCacheNamespace(content) = 'content:' + content`
(`graphql-response-cache.plugin.ts:36-37`). `PublicContent` is a closed union —
`'articles' | 'pages' | 'authors' | 'images' | 'paywalls' | 'polls'` (`:29-34`) — **an event
namespace would have to be added to both lists.**

Keys used under `content:articles`:

| Key | Written by |
| --- | --- |
| `id:<articleId>` | `ArticleDataloaderService` |
| `revisions:<articleId>` | `ArticleRevisionDataloaderService` |
| `slug:<lowercased slug>` | `ArticleService.getArticleBySlug` |
| `list:<JSON.stringify(args)>` | `ArticleService.getArticles` |

Invalidation API (`graphql-response-cache.plugin.ts:237-326`):

| Call | Effect |
| --- | --- |
| `invalidateDraft('articles')` | bumps the `content:articles` namespace version — all four key kinds above |
| `invalidate('articles')` | the above **plus** a reset of the public GraphQL response namespace (twice, 3 s apart, for read replicas) |
| `invalidateArticlePages(...{id, slug})` | resets the Next.js per-path caches `/a/<slug>` and `/a/id/<id>` |
| `invalidateArticleLayout()` | resets the website layout cache |
| `invalidateNavigations()` | resets the `navigations` namespace |
| `invalidateAt(date, ...contents)` | schedules `invalidate` for a future instant (≤ 24 h) |

Which mutation calls which:

| Mutation | invalidateDraft | invalidate | ArticlePages | ArticleLayout | Navigations |
| --- | --- | --- | --- | --- | --- |
| `createArticle` | ✓ | | | | |
| `updateArticle` (unpublished) | ✓ | | | | |
| `updateArticle` (published) | | ✓ | ✓ (old + new slug) | | |
| `publishArticle` | | ✓ | ✓ | | |
| `unpublishArticle` | | ✓ | ✓ | ✓ | |
| `deleteArticle` | | ✓ | ✓ | ✓ | ✓ |
| `duplicateArticle` | ✓ | | | | |
| `restoreArticleRevision` | ✓ | | | | |
| `discardArticleDraft` | ✓ | | | | |
| `likeArticle` / `dislikeArticle` | targeted `delNs` of `id:` and `slug:` only (`article.service.ts:776-786`) | | | | |

The GraphQL response cache additionally versions a response by the *draft* namespaces whenever the
query selects a `draft` or `pending` field anywhere in it, fragments included
(`graphql-response-cache.plugin.ts:127-164`):

```ts
const DRAFT_FIELDS = new Set(['draft', 'pending']);
const VERSIONED_BY_DRAFTS = [
  contentCacheNamespace('articles'),
  contentCacheNamespace('pages'),
];
```

A new event entity with `draft`/`pending` fields must add `contentCacheNamespace('events')` here,
or editor queries will be served stale after a save.

### 4.4 List queries against the views

`createArticleFilter` (`article.service.ts:1254-1286`) ANDs a list of clause builders and ORs the
three state clauses:

```ts
export const createArticleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  const andClauses = [
    createIdsFilter(filter), createTitleFilter(filter), createPreTitleFilter(filter),
    createPublicationDateFromFilter(filter), createPublicationDateToFilter(filter),
    createLeadFilter(filter), createSharedFilter(filter), createTagsFilter(filter),
    createAllTagsInFilter(filter), createTagsNotInFilter(filter), createAuthorFilter(filter),
    createHiddenFilter(filter), createExcludeHideAuthorFilter(filter),
    createPeerIdFilter(filter), createExcludeIdsFilter(filter),
  ].filter(c => !isEmptyWhere(c));

  const orClauses = [
    createPublishedFilter(filter), createDraftFilter(filter), createPendingFilter(filter),
  ].filter(c => !isEmptyWhere(c));

  if (orClauses.length > 0) { andClauses.push({ OR: orClauses }); }
  return andClauses.length > 0 ? { AND: andClauses } : {};
};
```

The three state filters (`:1012-1057`):

```ts
const createPublishedFilter = f =>
  f?.published != null
    ? { publishedAt: f.published ? { lte: new Date() } : { not: { lte: new Date() } } }
    : {};

const createDraftFilter = f =>
  f?.draft != null
    ? { revisions: { some: { publishedAt: f.draft ? null : { not: null }, archivedAt: null } } }
    : {};

const createPendingFilter = f =>
  f?.pending != null
    ? { revisions: { some: { publishedAt: f.pending ? { gt: new Date() } : { not: { gt: new Date() } } } } }
    : {};
```

Note the asymmetry that matters: **`published` is answered from the entity's `publishedAt`, while
`draft` and `pending` go through `revisions: { some: … }`** — neither of them uses the views. The
views are used only by the *content* filters (title, preTitle, lead, authors, hideAuthor), each of
which switches on which state the caller asked for:

```ts
return {
  ArticleRevisionPublished: filter?.published ? { articleRevision: titleFilter } : undefined,
  ArticleRevisionDraft:     filter?.draft     ? { articleRevision: titleFilter } : undefined,
  ArticleRevisionPending:   filter?.pending   ? { articleRevision: titleFilter } : undefined,
  revisions: !filter?.draft && !filter?.published && !filter?.pending
    ? { some: titleFilter } : undefined,
};
```

That block is copy-pasted five times in `article.service.ts` (lines 853-893, 894-935, 936-977,
1129-1173, 1186-1224) and twice in `page.service.ts` (655-695, 696-737). It is the single largest
piece of duplication in the revision system.

**Sorting never touches a revision.** `createArticleOrder` (`:817-837`) offers exactly three
fields, all on the entity:

```ts
switch (field) {
  case ArticleSort.CreatedAt:   return { createdAt:   graphQLSortOrderToPrisma(sortOrder) };
  case ArticleSort.ModifiedAt:  return { modifiedAt:  graphQLSortOrderToPrisma(sortOrder) };
  case ArticleSort.PublishedAt: return { publishedAt: graphQLSortOrderToPrisma(sortOrder) };
}
```

### 4.5 Version-history queries

`getArticleRevisions` (`article.service.ts:534-585`) deliberately queries the revisions table
directly rather than through the article, with its own pagination, because a long-lived page can
have thousands of revisions:

```ts
const where: Prisma.ArticleRevisionWhereInput = {
  articleId,
  ...(filter?.userId ? { userId: filter.userId } : {}),
};
const orderBy = { createdAt: graphQLSortOrderToPrisma(order) };

const [totalCount, revisions] = await Promise.all([
  this.prisma.articleRevision.count({ where }),
  this.prisma.articleRevision.findMany({
    where, skip, take: getMaxTake(take) + 1, orderBy,
    cursor: cursorId ? { id: cursorId } : undefined,
  }),
]);
```

`getRevisionById` (`:589-593`) loads one revision with full content, used by the read-only preview
drawer. Neither query filters by `archivedAt` — the history shows everything, including archived
autosaves.

---

## 5. How the website sees only published content

Three mechanisms, layered.

### 5.1 The `latest` resolver

`libs/article/api/src/lib/article.resolver.ts:233-252`:

```ts
@ResolveField(() => ArticleRevision)
async latest(@Parent() parent: PArticle, @PreviewMode() isPreview: boolean) {
  const { id: articleId } = parent;
  const { draft, pending, published } =
    await this.articleRevisionsDataloader.load(articleId);

  if (!isPreview) {
    if (published) { return published; }

    const showPending = !!(
      await this.settings.load(SettingName.SHOW_PENDING_WHEN_NOT_PUBLISHED)
    )?.value;

    return showPending && pending;
  }

  return draft ?? pending ?? published;
}
```

`SHOW_PENDING_WHEN_NOT_PUBLISHED` is a boolean `Setting`, seeded `false`
(`libs/api/prisma/seed.ts:178-188`, `libs/settings/api/src/lib/setting.ts:32`). The page resolver
(`page.resolver.ts:192-203`) has no such setting and simply returns `published`.

### 5.2 Forced filters on the list queries

`article.resolver.ts:113-131` and `page.resolver.ts:95-110`:

```ts
@Public()
@Query(() => PaginatedArticles)
public articles(@Args() args: ArticleListArgs, @PreviewMode() isPreview: boolean) {
  if (!isPreview) {
    args.filter = { ...args.filter, draft: undefined, pending: undefined, published: true };
  }
  return this.articleService.getArticles(args);
}
```

An anonymous caller cannot ask for drafts: whatever it sends is overwritten. Combined with
`createHiddenFilter`, which defaults to `hidden: false` unless `includeHidden` is set.

### 5.3 Field-level permissions

`draft` and `pending` are guarded with `@Permissions(CanGetArticle)` (`:254-270`); `published` and
`latest` are not. So an anonymous query asking for `draft { id }` is rejected at field level, not
silently nulled.

### 5.4 The single-item query is deliberately *not* filtered

`article(id | slug)` and `page(id | slug)` are `@Public()` and return the entity regardless of
publication state (`article.resolver.ts:57-94`). Only `latest` narrows. This is load-bearing and
documented in `.claude/docs/gotchas.md:260-273`:

> **Unpublished articles must answer 200, never 404 — the preview needs that page.** The editor
> preview opens the article's public URL and only then logs in and fetches the draft in the
> browser. A 404 for "no visible version" renders the 404 page instead, and the preview of every
> never-published article goes blank.

The consequence is the second gotcha (`gotchas.md:338-358`): because `Article.latest` is declared
non-nullable in the GraphQL schema (`article.model.ts:167-168`,
`@Field(() => ArticleRevision) latest!: ArticleRevision`) while the resolver can return
`undefined`/`false`, the public query for a never-published article answers

```
Cannot return null for non-nullable field ArticleRevision.id
```

with `INTERNAL_SERVER_ERROR`. The websites run `errorPolicy: 'all'` and `revalidateFor()` special-
cases it as `HIDDEN_CONTENT` so Next.js stores an empty 200 and renders `ContentUnavailable`
(`libs/content/website/src/lib/preview-unavailable/content-unavailable.tsx`) with `noindex`.
**Any new revisioned entity inherits this trap the moment it declares a non-nullable `latest`.**

### 5.5 Website fragments

`libs/website/api/src/lib/schemas/article.graphql:32-52` — the website only ever selects `latest`:

```graphql
fragment FullArticle on Article {
  ...SlimArticle
  trackingPixels { ...FullTrackingPixel }
  paywall { ...FullPaywall }
  latest { ...FullArticleRevision }
}

query Article($slug: String, $id: String) {
  article(slug: $slug, id: $id) { ...FullArticle }
}
```

The editor fragment (`libs/editor/api/src/lib/schemas/article-without-blocks.graphql:44-87`)
selects `latest` plus the three state pointers:

```graphql
latest   { ...FullArticleRevisionWithoutBlocks }
draft    { id }
pending  { id publishedAt }
published { id publishedAt }
```

---

## 6. Permissions

### 6.1 `@PreviewMode()`

`libs/permissions/api/src/lib/preview-mode.decorator.ts`:

```ts
export const PreviewMode = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  const user = ctx.getContext().req.user;
  const canPreview = hasPermission(CanPreview, user?.roles ?? []);
  return canPreview && !!ctx.getContext().req.headers.preview;
});
```

Preview requires **both** the `CanPreview` permission (`CAN_PREVIEW`,
`libs/permissions/src/lib/permissions.ts:793-797`) and a non-empty `preview` request header.

Who sends the header:

* **The editor, always** — `libs/editor/api/src/lib/setup.tsx:44-59` sets `preview: 'preview'` on
  every operation. So in the editor, `latest` is `draft ?? pending ?? published` and list queries
  are not forced to `published: true`.
* **The website, conditionally** — `libs/website/admin/src/lib/preview-link.ts`:

  ```ts
  export const PREVIEW_MODE_KEY = 'PREVIEW_MODE';
  export const previewLink = new ApolloLink((operation, forward) => {
    const isPreview =
      !!Number(sessionStorage.getItem(PREVIEW_MODE_KEY)) ||
      new URLSearchParams(window.location.search).has('preview');
    operation.setContext(context => ({ …, headers: { …, preview: isPreview ? `preview` : '' } }));
    return forward(operation);
  });
  ```

The response-cache plugin also keys off the header: an authenticated preview request is never
served from or written to the response cache (`graphql-response-cache.plugin.ts:176-177, 342-344`).

### 6.2 Permission matrix for articles and pages

| Operation | Articles | Pages |
| --- | --- | --- |
| read one / list | `@Public()` | `@Public()` |
| `draft` field | `CanGetArticle` | `CanGetPage` |
| `pending` field | `CanGetArticle` | `CanGetPage` |
| `published`, `latest` fields | — | — |
| revision list / single revision | `CanGetArticle` | `CanGetPage` |
| create / update / duplicate / discard / restore | `CanCreateArticle` | `CanCreatePage` |
| delete | `CanDeleteArticle` | `CanDeletePage` |
| publish / unpublish | `CanPublishArticle` | `CanPublishPage` |
| preview | `CanPreview` (+ header) | `CanPreview` (+ header) |

`libs/permissions/src/lib/permissions.ts:163-275, 793-797`. The guard itself
(`permission.guard.ts`) requires **all** listed permissions (`hasPermission` returns
`hasPerms.every(Boolean)`), but `@Permissions` is wrapped in `OneOf(PermissionsGuard)`, so if a
handler carries several guards only one needs to pass.

The editor mirrors the same ids client-side with `PermissionControl` /
`createCheckedPermissionComponent`: the publish button is wrapped in
`<PermissionControl qualifyingPermissions={[CanPublishArticle.id]}>`
(`articleEditor.tsx:924-947`), the version-history button in `[CanGetArticle.id]` (`:836-852`), the
discard button in `[CanCreateArticle.id]` (`:853-866`), and the whole route in
`[CanGetArticle, CanGetArticles, CanCreateArticle, CanDeleteArticle]` (`:1100-1107`).

This is exactly the hook D4 needs: `CanPublishEvent` wired as `@Permissions(CanPublishEvent)` on
`publishEvent`/`unpublishEvent`, and `<PermissionControl qualifyingPermissions={[CanPublishEvent.id]}>`
around the publish button, with the "Ready for review" button rendered in the `else` branch.

The editor role preset (`permissions.ts:1400-1445`) already grants `CanPublishArticle` and
`CanPublishPage` plus `CanPreview`; `AllPermissions` (`:1193…`) is the full list that the role UI
renders. A new `CanPublishEvent` must be added to `AllPermissions` to be assignable.

---

## 7. How the editor presents draft / pending / published

### 7.1 The editor header

`apps/editor/src/app/routes/articles/articleEditor.tsx:427-455`:

```ts
const { stateColor, tagTitle } = (() => {
  const pending = articleData?.article?.pending;
  if (pending) {
    return {
      stateColor: StateColor.pending,
      tagTitle: t('articleEditor.overview.pending', { date: new Date(pending.publishedAt ?? '') }),
    };
  }
  const publishedAt = articleData?.article?.latest.publishedAt;
  if (publishedAt) {
    return {
      stateColor: StateColor.published,
      tagTitle: t('articleEditor.overview.published', { date: new Date(publishedAt) }),
    };
  }
  return { stateColor: StateColor.draft, tagTitle: t('articleEditor.overview.unpublished') };
})();
```

`StateColor` (`libs/ui/editor/src/lib/utility.ts:232-237`) maps to CSS variables
`--wep-state-pending|published|draft|none`, consumed by `EditorHeader`
(`libs/ui/editor/src/lib/atoms/editorHeader.tsx:8-12`). `pageEditor.tsx:336-362` is identical.

Note the precedence: **pending wins over published in the header badge**, and the "published" label
reads `latest.publishedAt`, not `published.publishedAt`.

### 7.2 The list views

`apps/editor/src/app/routes/articles/articleList.tsx:173-205` builds a multi-state badge:

```ts
const states: State[] = [];
if (article.draft)     states.push({ state: 'draft',     text: t('articles.overview.draft') });
if (article.pending)   states.push({ state: 'pending',   text: t('articles.overview.pending') });
if (article.published) states.push({ state: 'published', text: t('articles.overview.published') });

<StatusBadge states={states.map(st => st.state)}>
  {states.map(st => st.text).join(' / ')}
</StatusBadge>
```

An article can legitimately be **all three at once** ("Draft / Pending / Published"). `StatusBadge`
(`libs/ui/editor/src/lib/listView/list-view.tsx:41-55`) colours by the highest-priority state:
pending > published > draft > none.

The publication-date column (`articleList.tsx:242-251`) shows
`published.publishedAt`, falling back to `pending.publishedAt` with a different label.

Filtering: `ARTICLE_FILTER_FIELDS` (`articleList.tsx:80-92`) includes `'draft'`, `'pending'`,
`'published'`, rendered by `ListViewFilters` as a multi-select chip filter
(`libs/ui/editor/src/lib/listView/list-view-filters.tsx:60-82, 228-232`) whose chips are coloured
with the same CSS variables. Unselected means "all three".

### 7.3 Version history

`VersionHistory` (`libs/ui/editor/src/lib/panel/versionHistoryPanel.tsx`) is a right-hand drawer
driven by `articleRevisions` + the three id pointers:

```tsx
<VersionHistory
  revisions={revisions}
  draftId={articleData?.article?.draft?.id}
  pendingId={articleData?.article?.pending?.id}
  publishedId={articleData?.article?.published?.id}
  …
/>
```
(`articleEditor.tsx:1040-1058`)

`getRevisionState` (`versionHistoryPanel.tsx:239-270`) classifies each row into five states —
`published`, `pending`, `draft`, `superseded` (published in the past but no longer current),
`archived` — with icons and colours (`:220-237`). Restoring the current draft is suppressed
(`:389`), and restore goes through a confirm dialog. `RevisionContentPreview`
(`libs/ui/editor/src/lib/panel/revisionContentPreview.tsx`, wired at `articleEditor.tsx:1060-1067`)
lazily loads one revision's blocks via `ArticleRevisionPreview`.

### 7.4 Publish dialog

`PublishArticlePanel` (`libs/ui/editor/src/lib/panel/publishArticlePanel.tsx`) takes a
`DateTimePicker` defaulting to *now*, warns when the chosen date is in the future
("articleEditor.panels.articlePending"), shows "first published at" vs "not published yet", and
lists the metadata that must be filled. `handlePublish` (`articleEditor.tsx:731-778`) always
**saves first, then publishes** — `updateArticle` followed by `publishArticle` — so publish always
operates on a freshly created revision.

### 7.5 Discard

Shown only when there is both a draft and a published revision
(`articleEditor.tsx:853-866`), behind a confirm dialog (`:1069-1097`).

---

## 8. Recipe: making a new entity revisioned the same way

Using `Event` as the worked example. Every row is a file that exists for articles.

### 8.1 Prisma schema

Add to `libs/api/prisma/schema.prisma`:

```prisma
model EventRevision {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  publishedAt DateTime? @db.Timestamptz(3)
  archivedAt  DateTime? @db.Timestamptz(3)

  // …content columns…
  blocks     Json
  properties Json @default("[]")

  eventId String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  EventRevisionPublished EventRevisionPublished[]
  EventRevisionPending   EventRevisionPending[]
  EventRevisionDraft     EventRevisionDraft[]

  @@index([publishedAt])
  @@index([eventId, createdAt(sort: Desc), id(sort: Desc)])
  @@map("events.revisions")
}

view EventRevisionPublished {
  id            String        @unique
  eventRevision EventRevision @relation(fields: [id], references: [id])
  eventId       String        @unique
  event         Event         @relation(fields: [eventId], references: [id])
  @@map("events.revisions.published")
}
// …Pending, Draft identically…
```

…and on `Event`: `publishedAt DateTime?`, `revisions EventRevision[]`,
`EventRevisionPublished EventRevisionPublished?` (+ Pending, Draft), `@@index([publishedAt])`.
The back-relations on the revision are declared as **arrays** even though the view's FK is
`@unique`; that is how the existing schema is written and Prisma accepts it.

### 8.2 Migration

One hand-written migration. Prisma generates the tables; you append the views and their indexes:

```sql
-- CreateTable / AlterTable generated by prisma migrate dev …

CREATE VIEW "events.revisions.published" AS
    SELECT DISTINCT ON ("eventId") id, "eventId"
    FROM "events.revisions"
    WHERE "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY "eventId", "createdAt" DESC, id DESC;

CREATE INDEX event_revisions_published_by_event_created_id_desc
    ON "events.revisions" ("eventId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;

CREATE VIEW "events.revisions.pending" AS
    SELECT DISTINCT ON ("eventId") id, "eventId"
    FROM "events.revisions"
    WHERE "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
    ORDER BY "eventId", "createdAt" DESC, id DESC;

CREATE VIEW "events.revisions.draft" AS
    SELECT DISTINCT ON ("eventId") id, "eventId"
    FROM "events.revisions"
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL
    ORDER BY "eventId", "createdAt" DESC, id DESC;

CREATE INDEX event_revisions_draft_by_event_created
    ON "events.revisions" ("eventId", "createdAt" DESC, "id" DESC)
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;

-- optional but recommended, matching articles:
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug") WHERE ("publishedAt" IS NOT NULL);
ALTER TABLE "events" ADD CONSTRAINT "events_slug_lowercase_check" CHECK (slug = LOWER(slug));
```

### 8.3 Files

| File | Model after | Content |
| --- | --- | --- |
| `libs/event/api/src/lib/event.model.ts` | `article.model.ts` | `EventRevision` `@ObjectType({ implements: [HasBlockContent, HasOptionalUserLc] })`, `Event` with `draft`/`pending`/`published`/`latest` fields, `PaginatedEvents`, `PaginatedEventRevisions`, `EventFilter` (with `draft`/`pending`/`published` booleans), `EventSort`, `EventListArgs`, `EventRevisionListArgs`, `CreateEventInput` via `OmitType(EventRevision, ['id','createdAt','publishedAt','archivedAt','userId','user','image','blocks','properties'], ArgsType)`, `UpdateEventInput extends CreateEventInput` |
| `libs/event/api/src/lib/event-dataloader.service.ts` | `article-dataloader.service.ts` | request-scoped, `kv.getOrLoadManyNs(contentCacheNamespace('events'), ids, …, 'id:')` |
| `libs/event/api/src/lib/event-revision-dataloader.service.ts` | `article-revision-dataloader.service.ts` | one query with `relationLoadStrategy: 'join'` including the three views; returns `{draft, pending, published}` |
| `libs/event/api/src/lib/event-publication.watcher.ts` | `article-publication.watcher.ts` | `@Interval(60_000)`, 70 s lookahead, `PublicationTimers`, public `schedule()` |
| `libs/event/api/src/lib/event.service.ts` | `article.service.ts` | `@PrimeDataLoader(EventDataloaderService)` on every entity-returning method; archive-then-create on update; publish/unpublish/duplicate/restore/discard; filter builders |
| `libs/event/api/src/lib/event.resolver.ts` | `article.resolver.ts` | `@Public()` reads, `@PreviewMode()` on `latest` and the list query, `@Permissions(CanGetEvent)` on `draft`/`pending`, `@Permissions(CanPublishEvent)` on publish/unpublish |
| `libs/event/api/src/lib/event-revision.resolver.ts` | `article-revision.resolver.ts` | `blocks` via `SlotTeasersLoader`, `properties` filtered by permission, `image` via `ImageDataloaderService` |
| `libs/event/api/src/lib/event.module.ts` | `article.module.ts` | imports `GraphqlResponseCacheModule`, `PrismaModule`, `ImageModule`, `TagModule`, `forwardRef(() => BlockContentModule)`; providers include the watcher; exports the dataloaders and the service |
| `libs/event/api/src/index.ts` | — | re-export model, service, both dataloaders, module |
| `libs/kv-ttl-cache/.../kv-ttl-cache-shared-namespaces.ts` | — | add `'content:events'` to `SHARED_NAMESPACES` |
| `libs/kv-ttl-cache/.../graphql-response-cache.plugin.ts` | — | add `'events'` to the `PublicContent` union and `contentCacheNamespace('events')` to `VERSIONED_BY_DRAFTS` |
| `libs/permissions/src/lib/permissions.ts` | — | `CanPublishEvent` etc., added to `AllPermissions` and the role presets |
| `libs/editor/api/src/lib/schemas/event.graphql` | `article.graphql` + `article-without-blocks.graphql` | fragments selecting `latest`, `draft { id }`, `pending { id publishedAt }`, `published { id publishedAt }`; mutations `PublishEvent`, `UnpublishEvent`, `DiscardEventDraft`, `RestoreEventRevision`, `DuplicateEvent`; queries `EventRevisionList`, `EventRevisionPreview` |
| `libs/website/api/src/lib/schemas/event.graphql` | website `article.graphql` | select `latest` only |
| `apps/editor/.../events/eventEditor.tsx` | `articleEditor.tsx` | state badge, publish dialog, version-history drawer, discard, autosave |
| `apps/editor/.../events/eventList.tsx` | `articleList.tsx` | `StatusBadge`, state filter fields |
| `libs/nest-modules/src/lib/urls/url-adapter.ts` | — | `getEventPreviewUrl` (today there is only `getEventURL`, with no `?preview`) |

### 8.4 Pitfalls, each with its evidence

1. **Views are not generated.** `prisma migrate dev` will create the tables and leave the views out.
   Write them by hand; copy the body into any later migration that re-creates them.
2. **A column type change on the revision table forces a view drop/recreate.** See
   `20260817121431_add_timezones_to_dates/migration.sql:2-7` and `372-438`. Put a comment in the
   migration pointing at the canonical view definition, as that migration does.
3. **Unique slugs can only be partial.** `CREATE UNIQUE INDEX … WHERE ("publishedAt" IS NOT NULL)`
   cannot be expressed in `schema.prisma`, so `prisma migrate diff` will not see it and
   `prisma db push` would drop it. Keep it in SQL and never `db push` against a real database.
4. **Duplicate slugs must be repaired before the index is created** if you migrate existing data —
   see the `ROW_NUMBER() OVER (PARTITION BY slug …)` pattern in the 2024 migration.
5. **`latest` must not be non-nullable unless you accept the `Cannot return null` behaviour.**
   Articles live with it deliberately (`gotchas.md:338-358`); a new entity can simply declare
   `@Field(() => EventRevision, { nullable: true })` and spare the website the special case —
   but then every website component must handle `latest == null`.
6. **Never 404 an unpublished entity** from the single-item query; the editor preview depends on a
   200 (`gotchas.md:260-273`).
7. **Register the KV namespace in three places** (`SHARED_NAMESPACES`, the `PublicContent` union,
   `VERSIONED_BY_DRAFTS`) or the editor will read stale drafts and the website stale publications.
8. **Add the query names to `CACHEABLE_QUERIES`** (`graphql-response-cache.plugin.ts:84-110`) —
   `event` and `events` are already there, so a renamed query would silently lose caching.
9. **Every new revision column must be added to four destructurings** — `duplicate*`, `restore*`
   for both entities — or it will be copied into clones and restored drafts.
10. **List filters that need revision content must go through the views**, with the four-way
    `published/draft/pending/else` switch; `revisions: { some: … }` answers "any revision ever",
    which is almost never what a UI means.
11. **List sorting cannot go through a revision.** Nothing in the repo does it; see §10.
12. **Dataloaders are `Scope.REQUEST`.** A singleton service that injects one must not cache it
    across requests; use `@PrimeDataLoader` rather than calling `prime` by hand.
13. **`@Interval` needs `ScheduleModule.forRoot()`**, registered once in the app module.
14. **The editor always sends `preview: 'preview'`** — do not assume `isPreview === false` in any
    code path reachable from the editor.
15. **Autosave means revision volume.** Budget for ~120 revision rows per editing hour per entity,
    each carrying a full `blocks` JSONB copy, and make sure anything hanging off a revision is
    cheap to duplicate.

---

## 9. What is article-specific and would need generalising

Honest assessment of the ~2 200 lines in `libs/article/api` + `libs/page/api`.

| Piece | Reusable as-is? | Comment |
| --- | --- | --- |
| The three view bodies | ✅ pure template | only the table/column names change |
| `PublicationTimers` | ✅ already shared | `libs/kv-ttl-cache/api` |
| `PublicContentCacheInvalidator` | ⚠️ partly | `PublicContent` is a closed union; `invalidateArticlePages` and `articlePagePaths` hard-code `/a/<slug>` and `/a/id/<id>` (`kv-ttl-cache-shared-namespaces.ts:78-84`) |
| `@PrimeDataLoader` / `Primeable` / `DataLoaderService` | ✅ generic | `libs/utils/api` |
| `ArticleDataloaderService` | ❌ copy-paste | 60 lines, differs only in the Prisma delegate and the namespace; `DataLoaderService<T>` exists but neither article nor page uses it |
| `ArticleRevisionDataloaderService` | ❌ copy-paste | 96 lines, differs only in names; a generic `RevisionDataloaderService<TEntity, TRevision>` would be straightforward |
| The publication watcher | ❌ copy-paste | three near-identical copies already exist (article, page, event-schedule) |
| `publishX` / `unpublishX` / `discardXDraft` / `restoreXRevision` | ❌ copy-paste | the state machine is identical; only the Prisma delegate names differ. ~250 lines duplicated per entity |
| The content filter builders | ❌❌ worst offender | the `published/draft/pending/else` switch appears **seven** times across the two services |
| `createXOrder` | ✅ trivially | three entity columns |
| `getXRevisions` / `getRevisionById` | ❌ copy-paste | identical apart from the delegate |
| `VersionHistory`, `RevisionContentPreview` | ✅ already generic | `VersionHistoryRevision` is explicitly documented as "both article and page revisions can be mapped to this shape" (`versionHistoryPanel.tsx:53-65`) |
| `StatusBadge`, `StateColor`, state filter chips | ✅ already generic | `libs/ui/editor` |
| `PublishArticlePanel` / `PublishPagePanel` | ❌ two copies | both take an entity-shaped `metadata` prop |
| The editor's save/publish/autosave/restore/discard handler block | ❌ copy-paste | `articleEditor.tsx` and `pageEditor.tsx` share ~300 lines of near-identical logic |
| `@PreviewMode()` | ✅ generic | |
| The `hidden` / `slug` / `tags` entity-side conventions | ✅ conventions, not code | |

**Article-specific, do not port:** peering (`shared`, `peerId`, `peerArticleId`, the
`CanGetSharedArticle` permissions), tracking pixels, paywalls, `likes`/`dislikes`, `breaking`,
`hideAuthor`, the author and social-media-author child tables, `SHOW_PENDING_WHEN_NOT_PUBLISHED`
(article-only), `hotAndTrending`, and the German-only full-text search SQL
(`article.service.ts:788-813`, `to_tsvector('german', …)` hard-coded).

**Recommendation.** Do not attempt a generic framework as part of this port — there is no existing
abstraction to extend, and two entities' worth of duplication is already tolerated in the repo.
Copy `libs/article/api` wholesale, delete what does not apply, and keep the names aligned so a
later extraction is mechanical. The one thing worth factoring out *now* is the filter switch, since
events will need it for at least title and location and it is already seven copies.

---

## 10. D5: where `reviewRequestedAt` belongs

Four questions were asked. Answers, with evidence.

### 10.1 Does a new draft revision get created per edit?

**Yes — per save, and saves are automatic.** `updateArticle` always archives the open draft and
creates a new revision (`article.service.ts:253-279`), and the editor fires the same mutation on a
30-second autosave timer (`useAutosave.ts:3`, `articleEditor.tsx:155-156, 693-720`). There is no
in-place draft update anywhere.

### 10.2 Would a field on the revision reset naturally on publish?

**No.** Publishing does not create a revision; it stamps `publishedAt` on the *existing* newest
revision (`article.service.ts:370-388`). A `reviewRequestedAt` stored on the revision would still
be set on the row that is now the published revision. It would only disappear from the *draft*
view, which is a different thing from "cleared".

Worse, the field would behave inconsistently across the other transitions:

| Transition | What happens to a revision-level `reviewRequestedAt` |
| --- | --- |
| publish | survives on the now-published revision |
| next edit after publish | gone — the new draft row starts at the column default |
| `unpublishArticle` | the formerly published revision becomes the draft again, **carrying the stale request** |
| `restoreArticleRevision` | **copied** into the new draft via `...content` (`:620-630`) unless explicitly destructured out |
| `duplicateArticle` | **copied** into the clone via `...revision` (`:478-490`) unless explicitly destructured out |
| autosave | cleared every 30 s while someone types — the request would vanish on the next keystroke cycle |

That last row is decisive on its own: an organiser clicks "Ready for review", then fixes a typo,
and the request silently disappears because the autosave created a fresh revision. The validator's
queue empties itself.

An entity-level field has none of these problems. It is cleared explicitly, once, in
`publishEvent` — the same place `article.publishedAt` is recomputed.

### 10.3 Can a list query filter and sort on such a field cheaply if it lives on the revision?

**Filter: expensively. Sort: not at all, by precedent.**

* Filtering would read `EventRevisionDraft: { eventRevision: { reviewRequestedAt: { not: null } } }`
  — a join from `events` to the `events.revisions.draft` view, which is itself a `DISTINCT ON`
  over the revisions table. The partial index
  `event_revisions_draft_by_event_created … WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL`
  makes the `DISTINCT ON` cheap, but the view has no index of its own and the predicate on
  `reviewRequestedAt` is applied *after* the distinct, so it cannot reduce the scan.
* Sorting is simply not available. `createArticleOrder` and `createPageOrder`
  (`article.service.ts:817-837`, `page.service.ts:633-653`) only ever order by `createdAt`,
  `modifiedAt` or `publishedAt` **on the entity**. No query in the repo orders an entity list by a
  revision column. To order by a revision field Prisma would need `orderBy: { EventRevisionDraft:
  { eventRevision: { reviewRequestedAt: 'asc' } } }`, which means sorting the full filtered set
  through a view join with no supporting index — exactly the shape D5's "oldest-first validation
  queue" would hammer.
* On the entity it is a plain column: `@@index([reviewRequestedAt])`, or better a partial index
  `CREATE INDEX … ON "events" ("reviewRequestedAt") WHERE "reviewRequestedAt" IS NOT NULL`, and the
  queue query becomes `WHERE "publishedAt" IS NULL AND "reviewRequestedAt" IS NOT NULL ORDER BY
  "reviewRequestedAt" ASC` — one index scan.

### 10.4 Verdict

**Keep `reviewRequestedAt` and `reviewRequestedById` on the event entity, as D5 provisionally
decided.** The research does not overturn the placement; it strengthens it. Concretely:

```prisma
model Event {
  …
  reviewRequestedAt   DateTime? @db.Timestamptz(3)
  reviewRequestedById String?
  reviewRequestedBy   User?     @relation("eventReviewRequestedBy", fields: [reviewRequestedById], references: [id], onDelete: SetNull)

  @@index([reviewRequestedAt])
}
```

with a partial index in raw SQL if the queue query profiles badly, and with the field cleared in
`publishEvent` next to `publishedAt`, in the same `prisma.event.update` call. This also matches the
repo's own direction of travel: `slug`, `likes` and `tags` were all *moved off* revisions onto the
entity precisely because list queries needed them (§1.8).

Two small follow-ons:

* `unpublishEvent` should decide whether it also clears the field. Clearing it is consistent with
  "publishing clears it"; not clearing it means an unpublished event re-enters the queue, which may
  be what a validator wants. Not answerable from the article code — **UNVERIFIED**, needs a product
  decision.
* The field is entity-level, so it does **not** appear in the version history. If "who asked, and
  when" needs an audit trail beyond the single current value, `libs/audit-log/api` is the existing
  mechanism (`AuditLog` model, `schema.prisma:2328`), not the revision table.

---

## 11. Occurrence expansion: revision or entity?

### 11.1 The two options

**(A) Occurrences belong to the revision.** `events.revisions.occurrence(revisionId, dateFrom,
dateTo)`. Each published revision carries the set of occurrences it declares; the website reads
occurrences through the published view.

**(B) Occurrences belong to the entity.** `events.occurrence(eventId, dateFrom, dateTo)`, derived
from whichever revision is currently published, re-expanded by the publish/unpublish mutations.

### 11.2 Sizing

From the BKa production restore (read-only query, this session):

```
occurrences | total_size
------------+------------
     118021 | 15 MB
```

`event_occurrence` is four columns (`id bigint`, `event_id bigint`, `date_from timestamptz`,
`date_to timestamptz`) with three indexes. Distribution
(`bka-08-event-domain-logic.md` §3.7): 20 356 one-shot events → 1 occurrence each; 13 163
sub-events → 1 each; **760 weekly events → 84 502 occurrences, average 111, maximum 12 374**
(event 27002, recurring to 2099-12-31). 41 events have ≥ 200 occurrences.

### 11.3 Cost of option A (revision-scoped)

Multiply all of the above by the number of revisions, and remember that **the revision count is
driven by autosave, not by deliberate saves** (§2.5):

* Editing the worst-case weekly event for ten minutes produces ~20 revisions × 12 374 occurrences
  = **247 480 rows** for one event — more than twice the entire BKa occurrence table.
* Each `updateEvent` would have to run the full delete-and-reinsert that BKa runs on every flush
  (`bka-08` §3.7: "saving event 27002 means 12 374 DELETEs + 12 374 INSERTs in a single flush"),
  except as pure INSERTs into a brand-new revision. Autosave would issue 12 374 inserts every 30
  seconds while somebody has the form open.
* `restoreEventRevision` and `duplicateEvent` would have to clone the whole occurrence set, like
  they clone author rows today (`article.service.ts:634-644`). Cloning three author rows is free;
  cloning 12 374 occurrence rows in a nested `createMany` is not.
* `deleteEvent` cascades through every revision's occurrences.
* The published-occurrence query gains a join through the `DISTINCT ON` view on every single
  calendar page load, instead of hitting an `(eventId, dateFrom)` index directly.
* Nothing prunes revisions, so this grows without bound.

The only thing option A buys is that an *unpublished draft* can be previewed with its own expanded
dates. That is worth something — the preview of a recurrence change is exactly what an organiser
wants to check — but it can be bought much more cheaply (§11.5).

### 11.4 Cost of option B (entity-scoped)

* One occurrence set per event, sized exactly like BKa's: ~118 k rows, ~15 MB, which is nothing.
* Re-expansion runs on `publishEvent` and `unpublishEvent` only — two call sites, deliberate user
  actions, never on autosave.
* Occurrence queries are plain indexed reads on `events.occurrence`, no view, no join through
  `DISTINCT ON`.
* `duplicateEvent` and `restoreEventRevision` do not touch occurrences at all (restoring a revision
  produces a *draft*; the live occurrences stay as published until someone publishes).
* `deleteEvent` cascades one level.

The costs:

* **Occurrences are not versioned.** The version history will show that the recurrence rule changed
  but cannot replay the dates that were live at the time. Given that `events.revisions` stores the
  rule, the expansion is reproducible from the revision on demand; it is just not materialised.
* **Unpublishing must clear or hide them**, otherwise an unpublished event keeps appearing in the
  calendar. Simplest: `publishEvent`/`unpublishEvent` own the occurrence table for that event, and
  unpublish deletes its rows (or the calendar query joins `events.publishedAt IS NOT NULL`, which
  it has to do anyway).
* **Pending publication is the awkward case.** With clock-driven publication (§3) nothing runs at
  the publication instant, so entity-level occurrences for a *pending* revision must be written at
  `publishEvent` time, before they are due. Two ways out, both acceptable:
  1. write the occurrences immediately and have the calendar query filter
     `events."publishedAt" <= now()` (the same predicate the published view uses) — occurrences
     exist but are invisible until the event is live; or
  2. carry `publishedAt` on the occurrence row and filter on it.
  Option 1 is less storage and matches how `articles.publishedAt` already gates list queries.

### 11.5 Recommendation

**Occurrences belong to the entity (option B), and the draft preview expands on the fly.**

The decisive asymmetry is that occurrence volume is driven by the *recurrence rule* (up to 12 374
rows for one event) while revision volume is driven by *typing* (one row per 30 seconds). Putting a
variable with a 12 000× range on top of a variable with a 120-per-hour range multiplies two things
that should never be multiplied. Nothing in the article system has this property: the largest
per-revision child set is the author list, three or four rows.

For the preview case, expand in memory. The algorithm is a bounded loop over days between
`dateFrom` and `dateTo` (`bka-08` §3.7); for the 99.6 % of events with ≤ 20 occurrences it is
instantaneous, and for the long tail the preview can cap at, say, the next 100 occurrences — which
is all a preview can usefully show anyway. That keeps the draft honest without materialising
anything.

Practical consequences:

* `events.occurrence` gets `eventId`, `dateFrom`, `dateTo`, FK `ON DELETE CASCADE`, and indexes on
  `(dateFrom)`, `(dateTo)`, `(eventId)` — mirroring BKa's `idx_252833_*`.
* The expansion function lives in the service and is called from exactly two places
  (`publishEvent`, `unpublishEvent`), plus a one-off backfill command for the data migration and a
  repair command equivalent to BKa's `EventsCalculateOccurrencesCommand`.
* The occurrence set is **derived state**, so it must be reproducible: keep the repair command and
  a test that re-expanding a published event is idempotent.
* The recurrence rule itself (the `recurrence` enum, `recurrenceWeekDays`, `dateFrom`, `dateTo`)
  does belong on the **revision**, because it is content the editor edits and the version history
  should show. Only the materialised expansion is entity-level.
* Unbounded recurrences (20 BKa events run past 2030, one to 2099) should get a cap at expansion
  time — BKa has none and pays 12 374 rows for one event. A horizon of, say, `now + 2 years`
  re-expanded by a periodic job would be a genuine improvement, but it reintroduces a job, which
  the current architecture has carefully avoided. **UNVERIFIED / product decision**: whether to cap.

---

## Porting notes

Implications for the port, clearly separated from the description above.

1. **Adopt the whole mechanism, not parts of it.** The views, the two state columns, the
   archive-then-create update, the clock-driven publication and the cache watcher are one design.
   Taking the views without the watcher gives five-minute-late publications; taking `publishedAt`
   without `archivedAt` breaks `discard` and `unpublish`.
2. **Events get a sixth and seventh view.** `events.revisions.{published,pending,draft}` plus their
   partial indexes, written by hand, re-created by every future migration that alters a column type
   on `events.revisions`.
3. **Add `AND "archivedAt" IS NULL` to the published and pending view bodies** for events. The
   article views omit it and are only safe by convention (§2.8); there is no reason to inherit the
   hazard.
4. **D1 maps cleanly.** `publication_status ∈ {draft, to_validate}` → a revision with
   `publishedAt IS NULL, archivedAt IS NULL`. `publish` with a past `publication_date` →
   `publishedAt = publication_date`. `publish` with a future `publication_date` → the same column,
   and the pending view picks it up with no extra modelling. BKa's embargo column and We.Publish's
   pending state are literally the same mechanism.
5. **D5 stands as written**: `reviewRequestedAt` on the entity (§10).
6. **D3's notification emails must fire from the mutation, not from the clock.** Nothing executes
   when a pending revision goes live (§3.2). `eventPublished` on a scheduled publication therefore
   has to be sent at `publishEvent` time, worded accordingly, or a real job has to be added. Flag
   this to whoever owns the mail work.
7. **The validation queue is an entity-level query**: `WHERE publishedAt IS NULL AND
   reviewRequestedAt IS NOT NULL ORDER BY reviewRequestedAt ASC`, plus the organisation predicate
   from D3/D4. No revision join, no view.
8. **Occurrences stay entity-level** (§11). Keep the recurrence *rule* on the revision.
9. **Budget for revision volume in the data migration.** 34 279 BKa events become 34 279 events
   plus 34 279 initial revisions; that is trivial. The growth comes afterwards, from autosave.
10. **The `preview` header is the only thing separating the editor's view from the public's.**
    Any new event query that forgets `@PreviewMode()` will either leak drafts to the website or
    hide drafts from the editor.
11. **`Event.latest` should be nullable** unless someone deliberately wants the article behaviour.
    Articles pay for non-nullability with a documented `HIDDEN_CONTENT` special case in every
    website app; a new entity need not.
12. **Three namespace registrations** are the easiest thing to forget: `SHARED_NAMESPACES`, the
    `PublicContent` union, `VERSIONED_BY_DRAFTS`.

## Open questions and UNVERIFIED items

* **Does `unpublishEvent` clear `reviewRequestedAt`?** Product decision; no article precedent.
* **Is a horizon cap on recurrence expansion wanted?** BKa has none (one event expands to 12 374
  rows out to 2099). A cap needs a periodic re-expansion job, which the current architecture
  otherwise avoids.
* **Should the three article content-filter blocks be factored out before events copy them?** The
  switch exists seven times already; an eighth, ninth and tenth copy for events would make it ten.
  A shared helper is mechanical but touches two shipped services.
* **Revision retention.** Nothing prunes `articles.revisions` or `pages.revisions`, and autosave
  writes one row per 30 s. I could not measure the real table sizes — the We.Publish database is
  stopped — so the practical size of the problem is **UNVERIFIED**. It would be settled by
  `SELECT count(*), pg_size_pretty(pg_total_relation_size('"articles.revisions"'))` against a
  production restore. If that number is large, events should ship with a retention policy rather
  than inherit the absence of one.
* **`PagesRevisionPublished` vs `ArticleRevisionPublished` naming.** Harmless today; pick
  `EventRevisionPublished` and consider renaming the page views in a later cleanup.
* **Whether the pending view's index is redundant.** `article_revisions_pending_by_article_created`
  has exactly the same columns, predicate and INCLUDE list as
  `article_revisions_published_by_article_created_id_desc`. It looks like a copy-paste; dropping it
  would halve the write cost of that pair. Not verified against a live plan.
