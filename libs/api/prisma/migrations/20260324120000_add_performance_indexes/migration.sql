-- CreateIndex
CREATE INDEX "articles.tagged-articles_tagId_idx" ON "articles.tagged-articles"("tagId");

-- CreateIndex
CREATE INDEX "properties_articleRevisionId_idx" ON "properties"("articleRevisionId");

-- CreateIndex
CREATE INDEX "properties_pageRevisionId_idx" ON "properties"("pageRevisionId");

-- CreateIndex
CREATE INDEX "properties_subscriptionId_idx" ON "properties"("subscriptionId");

-- CreateIndex
CREATE INDEX "properties_userId_idx" ON "properties"("userId");

-- CreateIndex (functional index for case-insensitive slug lookups used by ILIKE)
CREATE INDEX "articles_slug_lower_idx" ON "articles"(LOWER("slug"));

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "articles"("slug");

-- CreateIndex (composite for common filter: WHERE hidden = false AND publishedAt <= ?)
CREATE INDEX "articles_hidden_publishedAt_idx" ON "articles"("hidden", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles.tracking-pixels_articleId_idx" ON "articles.tracking-pixels"("articleId");

-- CreateIndex
CREATE INDEX "polls.answers_pollId_idx" ON "polls.answers"("pollId");

-- CreateIndex
CREATE INDEX "polls.votes_answerId_idx" ON "polls.votes"("answerId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionID_idx" ON "invoices"("subscriptionID");

-- CreateIndex
CREATE INDEX "subscriptions_userID_idx" ON "subscriptions"("userID");
