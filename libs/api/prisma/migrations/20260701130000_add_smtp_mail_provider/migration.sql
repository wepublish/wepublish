-- AlterEnum
ALTER TYPE "MailProviderType" ADD VALUE 'smtp';

-- AlterTable
ALTER TABLE "settings.mailprovider"
ADD COLUMN "smtp_host" TEXT,
ADD COLUMN "smtp_port" INTEGER,
ADD COLUMN "smtp_secure" BOOLEAN,
ADD COLUMN "smtp_user" TEXT;
