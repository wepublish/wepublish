-- Tokens hashed with sha256 can never verify against argon2
DELETE FROM "api-tokens.tokens";

-- DropIndex
DROP INDEX "api-tokens.tokens_tokenHash_key";

-- CreateIndex
CREATE INDEX "api-tokens.tokens_prefix_idx" ON "api-tokens.tokens"("prefix");
