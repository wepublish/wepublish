-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "puckBlocks" JSONB;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "puckBlocks" JSONB;
