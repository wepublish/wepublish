-- CreateIndex
CREATE INDEX "articles.revisions_articleId_idx" ON "articles.revisions"("articleId");

-- CreateIndex
CREATE INDEX "navigations.links_navigationId_idx" ON "navigations.links"("navigationId");

-- CreateIndex
CREATE INDEX "navigations.links_articleID_idx" ON "navigations.links"("articleID");

-- CreateIndex
CREATE INDEX "navigations.links_pageID_idx" ON "navigations.links"("pageID");

-- CreateIndex
CREATE INDEX "pages.revisions_pageId_idx" ON "pages.revisions"("pageId");
