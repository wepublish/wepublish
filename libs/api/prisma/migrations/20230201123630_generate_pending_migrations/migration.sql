-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_imageId_fkey";

-- AlterTable
ALTER TABLE "pages.revisions" RENAME CONSTRAINT "pages.revision_pkey" TO "pages.revisions_pkey";

-- RenameForeignKey
ALTER TABLE "pages.revisions" RENAME CONSTRAINT "pages.revision_imageID_fkey" TO "pages.revisions_imageID_fkey";

-- RenameForeignKey
ALTER TABLE "pages.revisions" RENAME CONSTRAINT "pages.revision_socialMediaImageID_fkey" TO "pages.revisions_socialMediaImageID_fkey";

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "pages.revision_publishAt_idx" RENAME TO "pages.revisions_publishAt_idx";

-- RenameIndex
ALTER INDEX "pages.revision_publishedAt_idx" RENAME TO "pages.revisions_publishedAt_idx";

-- RenameIndex
ALTER INDEX "pages.revision_tags_idx" RENAME TO "pages.revisions_tags_idx";

-- RenameIndex
ALTER INDEX "pages.revision_updatedAt_idx" RENAME TO "pages.revisions_updatedAt_idx";
