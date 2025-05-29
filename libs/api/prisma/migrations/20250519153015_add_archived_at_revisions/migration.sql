-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "archivedAt" TIMESTAMP(3);
UPDATE "articles.revisions" SET "archivedAt" = CURRENT_TIMESTAMP WHERE "publishedAt" IS NULL;

WITH latest AS (
    SELECT id
    FROM "articles.revisions"
    ORDER BY "createdAt" DESC
    LIMIT 1
)
UPDATE "articles.revisions"
SET "archivedAt" = NULL
WHERE id IN (SELECT id FROM latest) AND "publishedAt" IS NULL;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "archivedAt" TIMESTAMP(3);
UPDATE "pages.revisions" SET "archivedAt" = CURRENT_TIMESTAMP WHERE "publishedAt" IS NULL;

WITH latest AS (
    SELECT id
    FROM "pages.revisions"
    ORDER BY "createdAt" DESC
    LIMIT 1
)
UPDATE "pages.revisions"
SET "archivedAt" = NULL
WHERE id IN (SELECT id FROM latest) AND "publishedAt" IS NULL;
