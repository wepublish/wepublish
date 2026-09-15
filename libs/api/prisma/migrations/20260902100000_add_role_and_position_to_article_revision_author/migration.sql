-- AlterTable
ALTER TABLE "articles.revisions.author" ADD COLUMN "role" TEXT;

-- AlterTable
ALTER TABLE "articles.revisions.author" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

UPDATE "articles.revisions.author" AS "revisionAuthor"
SET "position" = "ordered"."position"
FROM (
  SELECT
    "articleRevisionAuthor"."revisionId",
    "articleRevisionAuthor"."authorId",
    ROW_NUMBER() OVER (
      PARTITION BY "articleRevisionAuthor"."revisionId"
      ORDER BY "articleRevisionAuthor".ctid ASC
    ) - 1 AS "position"
  FROM "articles.revisions.author" AS "articleRevisionAuthor"
  WHERE "articleRevisionAuthor"."revisionId" IN (
    SELECT "revisionId"
    FROM "articles.revisions.author"
    GROUP BY "revisionId"
    HAVING count(*) > 1
  )
) AS "ordered"
WHERE "revisionAuthor"."revisionId" = "ordered"."revisionId"
  AND "revisionAuthor"."authorId" = "ordered"."authorId"
  AND "revisionAuthor"."position" <> "ordered"."position";
