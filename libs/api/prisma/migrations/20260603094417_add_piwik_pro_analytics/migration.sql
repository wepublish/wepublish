-- AlterTable
ALTER TABLE "settings.website" ADD COLUMN     "analyticsPiwikEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "analyticsPiwikId" TEXT;
