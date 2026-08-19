  -- AlterEnum
ALTER TYPE "MolliePaymentMethod" RENAME VALUE 'VOUCHER' TO 'DISCOUNTCODE'

-- DropIndex
DROP INDEX IF EXISTS "articles.revisions_articleId_idx";

-- DropIndex
DROP INDEX IF EXISTS "pages.revisions_pageId_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "authors.links_authorId_idx" ON "authors.links"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comments.rating-override_commentId_idx" ON "comments.rating-override"("commentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comments.ratings_commentId_idx" ON "comments.ratings"("commentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comments.revisions_commentId_idx" ON "comments.revisions"("commentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_dueAt_idx" ON "invoices"("dueAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices.items_invoiceId_idx" ON "invoices.items"("invoiceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mail.log_recipientID_sentDate_idx" ON "mail.log"("recipientID", "sentDate" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_memberPlanID_createdAt_id_idx" ON "subscriptions"("memberPlanID", "createdAt", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions.periods_subscriptionId_idx" ON "subscriptions.periods"("subscriptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions.periods_invoiceID_idx" ON "subscriptions.periods"("invoiceID");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users.payment-providers_userId_idx" ON "users.payment-providers"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "articles.revisions_articleId_createdAt_id_idx" ON "articles.revisions"("articleId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pages.revisions_pageId_createdAt_id_idx" ON "pages.revisions"("pageId", "createdAt" DESC, "id" DESC);
