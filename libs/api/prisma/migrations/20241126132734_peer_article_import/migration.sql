-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "peerArticleId" TEXT,
ADD COLUMN     "peerId" TEXT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
