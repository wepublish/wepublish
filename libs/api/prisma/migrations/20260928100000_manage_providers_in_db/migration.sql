ALTER TABLE "settings.paymentprovider"   ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "settings.trackingpixel"     ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "settings.mailprovider"      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "settings.challengeprovider" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ(3);

ALTER TYPE "MailProviderType" ADD VALUE IF NOT EXISTS 'log';
