-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey";

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
