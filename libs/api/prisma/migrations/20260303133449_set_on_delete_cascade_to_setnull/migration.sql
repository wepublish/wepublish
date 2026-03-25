-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_peerId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions" DROP CONSTRAINT "articles.revisions_userId_fkey";

-- DropForeignKey
ALTER TABLE "authors" DROP CONSTRAINT "authors_peerId_fkey";

-- DropForeignKey
ALTER TABLE "comments.ratings" DROP CONSTRAINT "comments.ratings_userId_fkey";

-- DropForeignKey
ALTER TABLE "images" DROP CONSTRAINT "images_peerId_fkey";

-- DropForeignKey
ALTER TABLE "pages.revisions" DROP CONSTRAINT "pages.revisions_userId_fkey";

-- DropForeignKey
ALTER TABLE "polls.votes" DROP CONSTRAINT "polls.votes_userId_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_peerId_fkey";

-- AddForeignKey
ALTER TABLE "articles.revisions" ADD CONSTRAINT "articles.revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.ratings" ADD CONSTRAINT "comments.ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages.revisions" ADD CONSTRAINT "pages.revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.votes" ADD CONSTRAINT "polls.votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
