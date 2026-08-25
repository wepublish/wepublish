-- CreateEnum
CREATE TYPE "LetterProviderType" AS ENUM ('pingen');

-- CreateEnum
CREATE TYPE "LetterProviderEnvironment" AS ENUM ('production', 'staging');

-- CreateTable
CREATE TABLE "settings.letterprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastLoadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LetterProviderType" NOT NULL,
    "environment" "LetterProviderEnvironment" NOT NULL DEFAULT 'staging',
    "name" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "organisationId" TEXT,
    "webhookSigningKey" TEXT,
    "autoSend" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "settings.letterprovider_pkey" PRIMARY KEY ("id")
);
