-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "impersonatedBy" TEXT;
ALTER TABLE "sessions" ADD COLUMN "impersonationReason" TEXT;
ALTER TABLE "sessions" ADD COLUMN "impersonatedAt" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "sessions_impersonatedBy_idx" ON "sessions"("impersonatedBy");

-- CreateTable
CREATE TABLE "impersonation_grants" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "redeemedAt" TIMESTAMPTZ(3),

    CONSTRAINT "impersonation_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "impersonation_grants_jti_key" ON "impersonation_grants"("jti");
CREATE INDEX "impersonation_grants_expiresAt_idx" ON "impersonation_grants"("expiresAt");
