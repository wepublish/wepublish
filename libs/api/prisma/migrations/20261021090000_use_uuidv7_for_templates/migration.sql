-- AlterTable
ALTER TABLE "article_templates" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "page_templates" ALTER COLUMN "id" SET DEFAULT uuidv7();
