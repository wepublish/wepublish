-- CreateEnum
CREATE TYPE "FrontendTrackingProviderType" AS ENUM ('googleAnalytics4', 'googleTagManager', 'plausible', 'piwikPro');

-- CreateTable
CREATE TABLE "settings.frontendTracking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "FrontendTrackingProviderType" NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "ga4_measurementId" TEXT,
    "gtm_containerId" TEXT,
    "plausible_siteId" TEXT,
    "plausible_scriptUrl" TEXT,
    "piwik_containerId" TEXT,
    "piwik_subdomain" TEXT,

    CONSTRAINT "SettingFrontendTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettingFrontendTracking_type_key" ON "settings.frontendTracking"("type");

-- CreateTable
CREATE TABLE "settings.sparkloop" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "teamId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SettingSparkloop_pkey" PRIMARY KEY ("id")
);
