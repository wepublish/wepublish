-- AlterTable
ALTER TABLE "settings.syncprovider" ADD COLUMN "mailchimp_extensions" JSONB NOT NULL DEFAULT '{}';
