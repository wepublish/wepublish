-- AlterEnum
ALTER TYPE "UserEvent" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT,
ADD COLUMN "pendingEmailAt" TIMESTAMP(3);
