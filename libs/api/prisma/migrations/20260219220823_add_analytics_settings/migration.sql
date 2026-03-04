-- CreateEnum
CREATE TYPE "AnalyticsProviderType" AS ENUM ('google');

-- CreateTable
CREATE TABLE "settings.analyticsProvider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AnalyticsProviderType" NOT NULL,
    "name" TEXT,
    "credentials" TEXT,
    "property" TEXT,
    "articlePrefix" TEXT,

    CONSTRAINT "settings.analyticsProvider_pkey" PRIMARY KEY ("id")
);
