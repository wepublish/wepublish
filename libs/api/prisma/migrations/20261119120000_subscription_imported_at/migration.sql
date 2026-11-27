-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "importedAt" TIMESTAMPTZ(3),
ADD COLUMN     "legacyEndedAt" TIMESTAMPTZ(3);
