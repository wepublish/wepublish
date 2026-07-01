-- CreateIndex
CREATE INDEX "articles.tagged-articles_tagId_articleId_idx" ON "articles.tagged-articles"("tagId", "articleId");
