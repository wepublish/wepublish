-- AddForeignKey
ALTER TABLE "navigations.links" ADD CONSTRAINT "navigations.links_articleID_fkey" FOREIGN KEY ("articleID") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigations.links" ADD CONSTRAINT "navigations.links_pageID_fkey" FOREIGN KEY ("pageID") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
