-- CreateTable
CREATE TABLE "api-tokens.tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "lastUsedAt" TIMESTAMPTZ(3),
    "createdById" TEXT,

    CONSTRAINT "api-tokens.tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api-tokens.tokens_tokenHash_key" ON "api-tokens.tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "api-tokens.tokens_createdAt_idx" ON "api-tokens.tokens"("createdAt");

-- CreateIndex
CREATE INDEX "api-tokens.tokens_createdById_idx" ON "api-tokens.tokens"("createdById");

-- AddForeignKey
ALTER TABLE "api-tokens.tokens" ADD CONSTRAINT "api-tokens.tokens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

