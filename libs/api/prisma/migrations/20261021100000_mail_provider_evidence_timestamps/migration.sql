-- AlterTable
ALTER TABLE "settings.mailprovider" ADD COLUMN     "lastPollAt" TIMESTAMPTZ(3),
ADD COLUMN     "lastPollError" TEXT,
ADD COLUMN     "lastWebhookAt" TIMESTAMPTZ(3);
