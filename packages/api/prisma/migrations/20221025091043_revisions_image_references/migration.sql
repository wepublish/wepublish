-- AddForeignKey
ALTER TABLE "articles.revisions" ADD CONSTRAINT "articles.revisions_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions" ADD CONSTRAINT "articles.revisions_socialMediaImageID_fkey" FOREIGN KEY ("socialMediaImageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages.revision" ADD CONSTRAINT "pages.revision_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages.revision" ADD CONSTRAINT "pages.revision_socialMediaImageID_fkey" FOREIGN KEY ("socialMediaImageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
