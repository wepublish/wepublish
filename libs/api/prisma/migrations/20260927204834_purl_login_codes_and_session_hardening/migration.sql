-- CreateEnum
CREATE TYPE "SessionOrigin" AS ENUM ('password', 'jwt', 'purl', 'preview', 'impersonation', 'register');

-- AlterEnum
ALTER TYPE "UserEvent" ADD VALUE 'EMAIL_VERIFICATION';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "origin" "SessionOrigin" NOT NULL DEFAULT 'password';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pendingEmailTokenHash" TEXT;

-- CreateTable
CREATE TABLE "user_login_codes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "maxUses" INTEGER NOT NULL,
    "usesRemaining" INTEGER NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "revokedBy" TEXT,
    "issuedBy" TEXT,

    CONSTRAINT "user_login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_login_codes_codeHash_key" ON "user_login_codes"("codeHash");

-- CreateIndex
CREATE INDEX "user_login_codes_userId_idx" ON "user_login_codes"("userId");

-- CreateIndex
CREATE INDEX "user_login_codes_expiresAt_idx" ON "user_login_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_pendingEmailTokenHash_key" ON "users"("pendingEmailTokenHash");

-- AddForeignKey
ALTER TABLE "user_login_codes" ADD CONSTRAINT "user_login_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

