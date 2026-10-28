-- AlterTable
ALTER TABLE "apps.external" ADD COLUMN     "apiTokenId" TEXT;

-- CreateIndex
CREATE INDEX "apps.external_apiTokenId_idx" ON "apps.external"("apiTokenId");

-- AddForeignKey
ALTER TABLE "apps.external" ADD CONSTRAINT "apps.external_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
