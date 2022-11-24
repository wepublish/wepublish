-- AlterEnum
ALTER TYPE "CommentItemType" ADD VALUE 'peerArticle';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "peerId" TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
