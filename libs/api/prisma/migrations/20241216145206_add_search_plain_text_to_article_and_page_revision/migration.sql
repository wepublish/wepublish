-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "searchPlainText" TEXT;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "searchPlainText" TEXT;
