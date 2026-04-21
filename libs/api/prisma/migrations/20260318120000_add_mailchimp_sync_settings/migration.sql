-- CreateEnum
CREATE TYPE "SyncProviderType" AS ENUM ('mailchimp');

-- CreateTable
CREATE TABLE "settings.syncprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SyncProviderType" NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mailchimp_apiKey" TEXT,
    "mailchimp_listId" TEXT,
    "mailchimp_mergeFieldMappings" JSONB NOT NULL DEFAULT '[]',
    "mailchimp_interestGroupMappings" JSONB NOT NULL DEFAULT '[]',
    "mailchimp_defaultInterestGroupIds" JSONB NOT NULL DEFAULT '[]',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,

    CONSTRAINT "settings.syncprovider_pkey" PRIMARY KEY ("id")
);
