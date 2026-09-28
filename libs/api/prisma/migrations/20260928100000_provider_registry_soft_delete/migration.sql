
ALTER TABLE "settings.paymentprovider" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "settings.trackingpixel"   ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
