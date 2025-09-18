-- Fix archivedAts again since unpublishg didn't set the archivedAt of unpublished revisions
-- Copied over SQL from 20250519153016_fix_archived_at_revisions

-- Set all draft revisions to archived if not already
UPDATE "articles.revisions" SET "archivedAt" = CURRENT_TIMESTAMP WHERE "publishedAt" IS NULL AND "archivedAt" IS NULL;
-- If latest revision is a draft revision, unarchive
UPDATE "articles.revisions" AS r
SET "archivedAt" = NULL
FROM (
    SELECT DISTINCT ON ("articleId") id
    FROM "articles.revisions"
    ORDER BY "articleId", "createdAt" DESC
) AS latest
WHERE r.id = latest.id AND "publishedAt" IS NULL;

UPDATE "pages.revisions" SET "archivedAt" = CURRENT_TIMESTAMP WHERE "publishedAt" IS NULL AND "archivedAt" IS NULL;
UPDATE "pages.revisions" AS r
SET "archivedAt" = NULL
FROM (
    SELECT DISTINCT ON ("pageId") id
    FROM "pages.revisions"
    ORDER BY "pageId", "createdAt" DESC
) AS latest
WHERE r.id = latest.id AND "publishedAt" IS NULL;
