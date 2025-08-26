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
CREATE INDEX article_revisions_published_pubat_article_created_id_desc
    ON "articles.revisions" ("publishedAt", "articleId", "createdAt" DESC, "id" DESC)
    WHERE "publishedAt" IS NOT NULL;

CREATE VIEW "articles.revisions.pending" AS
    SELECT
        id,
        "articleId"
    FROM
        "articles.revisions"
    WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
    ORDER BY
        "articleId", "createdAt" DESC
;
CREATE INDEX article_revisions_pending_pubat
    ON "articles.revisions" ("publishedAt", "articleId", "createdAt" DESC, "id" DESC)
    WHERE "publishedAt" IS NOT NULL;

CREATE INDEX article_revisions_pending_by_article_created
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;


CREATE VIEW "articles.revisions.draft" AS
    SELECT
        id,
        "articleId"
    FROM
        "articles.revisions"
    WHERE
        "archivedAt" IS NULL AND "publishedAt" is NULL
    ORDER BY
        "articleId", "createdAt" DESC
;

CREATE INDEX article_revisions_draft_by_article_created
    ON "articles.revisions" ("articleId", "createdAt" DESC, "id" DESC)
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;

CREATE INDEX article_revisions_draft_created_global
    ON "articles.revisions" ("createdAt" DESC, "id" DESC)
    INCLUDE ("articleId")
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;


/** VIEWS for Pages **/

CREATE VIEW "pages.revisions.published" AS
SELECT DISTINCT ON ("pageId")
    id,
    "pageId"
FROM
    "pages.revisions"
WHERE
    "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
ORDER BY
    "pageId", "createdAt" DESC
;

CREATE INDEX page_revisions_published_by_page_created_id_desc
    ON "pages.revisions" ("pageId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;
CREATE INDEX page_revisions_published_pubat_page_created_id_desc
    ON "pages.revisions" ("publishedAt", "pageId", "createdAt" DESC, "id" DESC)
    WHERE "publishedAt" IS NOT NULL;


CREATE VIEW "pages.revisions.pending" AS
SELECT
    id,
    "pageId"
FROM
    "pages.revisions"
WHERE
    "publishedAt" IS NOT NULL AND "publishedAt" > CURRENT_TIMESTAMP
ORDER BY
    "pageId", "createdAt" DESC
;
CREATE INDEX page_revisions_pending_pubat
    ON "pages.revisions" ("publishedAt", "pageId", "createdAt" DESC, "id" DESC)
    WHERE "publishedAt" IS NOT NULL;

CREATE INDEX page_revisions_pending_by_page_created
    ON "pages.revisions" ("pageId", "createdAt" DESC, "id" DESC)
    INCLUDE ("publishedAt")
    WHERE "publishedAt" IS NOT NULL;

CREATE VIEW "pages.revisions.draft" AS
SELECT
    id,
    "pageId"
FROM
    "pages.revisions"
WHERE
    "archivedAt" IS NULL AND "publishedAt" is NULL
ORDER BY
    "pageId", "createdAt" DESC
;

CREATE INDEX page_revisions_draft_by_article_created
    ON "pages.revisions" ("pageId", "createdAt" DESC, "id" DESC)
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;

CREATE INDEX page_revisions_draft_created_global
    ON "pages.revisions" ("createdAt" DESC, "id" DESC)
    INCLUDE ("pageId")
    WHERE "archivedAt" IS NULL AND "publishedAt" IS NULL;
