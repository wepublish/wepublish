-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "pageId" TEXT;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

