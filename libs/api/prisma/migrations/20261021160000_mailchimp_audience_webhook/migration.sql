-- AlterTable
ALTER TABLE "settings.syncprovider" ADD COLUMN     "lastWebhookAt" TIMESTAMPTZ(3),
ADD COLUMN     "mailchimp_webhookId" TEXT,
ADD COLUMN     "mailchimp_webhookRegisteredAt" TIMESTAMPTZ(3),
ADD COLUMN     "mailchimp_webhookSecret" TEXT;
