UPDATE "articles.revisions" AS r
SET "archivedAt" = NULL
FROM (
    SELECT DISTINCT ON ("articleId") id
    FROM "articles.revisions"
    ORDER BY "articleId", "createdAt" DESC
) AS latest
WHERE r.id = latest.id AND "publishedAt" IS NULL;

UPDATE "pages.revisions" AS r
SET "archivedAt" = NULL
FROM (
    SELECT DISTINCT ON ("pageId") id
    FROM "pages.revisions"
    ORDER BY "pageId", "createdAt" DESC
) AS latest
WHERE r.id = latest.id AND "publishedAt" IS NULL;
