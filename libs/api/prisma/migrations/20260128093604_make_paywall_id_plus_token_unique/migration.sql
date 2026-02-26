-- DropIndex
DROP INDEX "paywall_bypasses_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "paywall_bypasses_paywallId_token_key" ON "paywall_bypasses"("paywallId", "token");
