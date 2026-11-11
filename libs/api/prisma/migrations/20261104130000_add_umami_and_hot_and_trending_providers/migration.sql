-- AlterEnum
ALTER TYPE "AnalyticsProviderType" ADD VALUE 'plausible';
ALTER TYPE "AnalyticsProviderType" ADD VALUE 'umami';

-- AlterTable
ALTER TABLE "settings.analyticsProvider" ADD COLUMN     "url" TEXT,
ADD COLUMN     "hotAndTrending" BOOLEAN NOT NULL DEFAULT false;

-- Google Analytics was the only Hot & Trending provider so far
UPDATE "settings.analyticsProvider" SET "hotAndTrending" = true WHERE "type" = 'google';

-- AlterTable
ALTER TABLE "settings.website" ADD COLUMN     "analyticsUmamiEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "analyticsUmamiId" TEXT;
