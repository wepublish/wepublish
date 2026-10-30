-- AlterTable
ALTER TABLE "users.payment-providers" ADD COLUMN     "syncedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "settings.paymentprovider" ADD COLUMN     "bexio_contactSync" BOOLEAN,
ADD COLUMN     "bexio_contactSyncAt" TIMESTAMPTZ(3),
ADD COLUMN     "bexio_contactSyncError" TEXT;

