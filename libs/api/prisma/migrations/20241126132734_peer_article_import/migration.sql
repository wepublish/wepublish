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

-- DropIndex
DROP INDEX "authors_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_peerId_key" ON "authors"("slug", "peerId");
/* Ensure's that when peerId is empty, slug is still unique */
CREATE UNIQUE INDEX "authors_slug_no_peerId" ON "authors"("slug") where "authors"."peerId" is null;

-- AlterEnum
BEGIN;
DELETE FROM "comments" where "itemType" = 'peerArticle'::"CommentItemType";
CREATE TYPE "CommentItemType_new" AS ENUM ('article', 'page');
ALTER TABLE "comments" ALTER COLUMN "itemType" TYPE "CommentItemType_new" USING ("itemType"::text::"CommentItemType_new");
ALTER TYPE "CommentItemType" RENAME TO "CommentItemType_old";
ALTER TYPE "CommentItemType_new" RENAME TO "CommentItemType";
DROP TYPE "CommentItemType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_peerId_fkey";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "peerId";
