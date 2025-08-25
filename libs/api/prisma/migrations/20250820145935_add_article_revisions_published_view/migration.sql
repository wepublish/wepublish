/** VIEWS for articles **/

CREATE VIEW "article.revisions.published" AS
    SELECT DISTINCT ON ("articleId")
        id,
        "articleId"
        FROM
        "articles.revisions"
        WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY
    "articleId", "createdAt" DESC
;

CREATE VIEW "article.revisions.pending" AS
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
CREATE VIEW "article.revisions.archived" AS
    SELECT
        id,
        "articleId"
    FROM
        "articles.revisions"
    WHERE
        "archivedAt" IS NOT NULL AND "archivedAt" <= CURRENT_TIMESTAMP
    ORDER BY
        "articleId", "createdAt" DESC
;

CREATE VIEW "article.revisions.draft" AS
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
CREATE VIEW "pages.revisions.archived" AS
SELECT
    id,
    "pageId"
FROM
    "pages.revisions"
WHERE
    "archivedAt" IS NOT NULL AND "archivedAt" <= CURRENT_TIMESTAMP
ORDER BY
    "pageId", "createdAt" DESC
;

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
