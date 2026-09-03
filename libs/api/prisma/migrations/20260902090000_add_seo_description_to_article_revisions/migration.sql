-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN "seoDescription" TEXT;

-- Default the seoDescription from the existing lead
UPDATE "articles.revisions"
SET "seoDescription" = "lead"
WHERE "lead" IS NOT NULL;
