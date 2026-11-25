-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "emailConfirmedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pendingEmailSessionId" TEXT;
