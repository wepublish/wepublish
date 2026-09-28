-- AlterTable: rename the existing columns to their SEO counterparts
ALTER TABLE "pages.revisions" RENAME COLUMN "title" TO "seoTitle";
ALTER TABLE "pages.revisions" RENAME COLUMN "description" TO "seoDescription";

-- AlterTable: re-add title and description
ALTER TABLE "pages.revisions" ADD COLUMN "title" TEXT;
ALTER TABLE "pages.revisions" ADD COLUMN "description" TEXT;

-- Copy the data from seoTitle and seoDescription
UPDATE "pages.revisions"
SET "title" = "seoTitle",
    "description" = "seoDescription";
