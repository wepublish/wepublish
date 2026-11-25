-- AlterTable
ALTER TABLE "settings.website" ADD COLUMN     "analyticsUmamiExcludedSearchParams" TEXT[] DEFAULT ARRAY[]::TEXT[];
