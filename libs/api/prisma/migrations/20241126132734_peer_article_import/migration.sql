-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "peerArticleId" TEXT,
ADD COLUMN     "peerId" TEXT;

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "peerId" TEXT;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "peerId" TEXT;

-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "peerId" TEXT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
