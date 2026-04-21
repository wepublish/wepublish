-- AlterTable
ALTER TABLE "users" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "totpExempt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "totpSecret" TEXT;
