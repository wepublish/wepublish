-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TagType" ADD VALUE 'article';
ALTER TYPE "TagType" ADD VALUE 'page';

-- CreateTable
CREATE TABLE "articles.tagged-articles" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles.tagged-articles_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateTable
CREATE TABLE "pages.tagged-pages" (
    "pageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages.tagged-pages_pkey" PRIMARY KEY ("pageId","tagId")
);

-- AddForeignKey
ALTER TABLE "articles.tagged-articles" ADD CONSTRAINT "articles.tagged-articles_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.tagged-articles" ADD CONSTRAINT "articles.tagged-articles_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages.tagged-pages" ADD CONSTRAINT "pages.tagged-pages_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages.tagged-pages" ADD CONSTRAINT "pages.tagged-pages_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;


