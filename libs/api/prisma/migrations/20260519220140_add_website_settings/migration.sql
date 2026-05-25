-- CreateTable
CREATE TABLE "settings.website" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "analyticsGAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsGAId" TEXT,
    "analyticsGTMEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsGTMId" TEXT,
    "analyticsPAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsPAId" TEXT,
    "adsSparkLoopEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adsSparkLoopId" TEXT,
    "mailMailchimpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mailMailchimpKey" TEXT,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "fonts" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "settings.website_pkey" PRIMARY KEY ("id")
);

INSERT INTO "settings.website" ("id", "modifiedAt") VALUES ('default', CURRENT_TIMESTAMP);