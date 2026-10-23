-- AlterTable
ALTER TABLE "api-tokens.tokens" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "api-tokens.tokens_organizationId_idx" ON "api-tokens.tokens"("organizationId");

-- AddForeignKey
ALTER TABLE "api-tokens.tokens" ADD CONSTRAINT "api-tokens.tokens_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "events.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
