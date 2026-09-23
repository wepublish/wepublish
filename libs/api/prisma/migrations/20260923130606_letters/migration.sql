-- CreateEnum
CREATE TYPE "MailChannel" AS ENUM ('mail', 'letter');

-- CreateEnum
CREATE TYPE "LetterProviderType" AS ENUM ('pingen');

-- CreateEnum
CREATE TYPE "LetterProviderEnvironment" AS ENUM ('production', 'staging');

-- CreateEnum
CREATE TYPE "LetterAddressPosition" AS ENUM ('left', 'right');

-- CreateEnum
CREATE TYPE "LetterDeliveryProduct" AS ENUM ('fast', 'cheap', 'bulk', 'premium', 'registered');

-- CreateEnum
CREATE TYPE "LetterPrintMode" AS ENUM ('simplex', 'duplex');

-- CreateEnum
CREATE TYPE "LetterPrintSpectrum" AS ENUM ('color', 'grayscale');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MailLogState" ADD VALUE 'dispatched';
ALTER TYPE "MailLogState" ADD VALUE 'undeliverable';
ALTER TYPE "MailLogState" ADD VALUE 'canceled';

-- AlterTable
ALTER TABLE "mail.log" ADD COLUMN     "addressSnapshot" JSONB,
ADD COLUMN     "channel" "MailChannel" NOT NULL DEFAULT 'mail',
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "providerLetterID" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "mail.send_jobs" ADD COLUMN     "addressPosition" "LetterAddressPosition" NOT NULL DEFAULT 'left',
ADD COLUMN     "channel" "MailChannel" NOT NULL DEFAULT 'mail',
ADD COLUMN     "deliveryProduct" "LetterDeliveryProduct" NOT NULL DEFAULT 'cheap',
ADD COLUMN     "printMode" "LetterPrintMode" NOT NULL DEFAULT 'simplex',
ADD COLUMN     "printSpectrum" "LetterPrintSpectrum" NOT NULL DEFAULT 'grayscale';

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
    "placeholderEmailContains" TEXT,

    CONSTRAINT "settings.letterprovider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail.log_providerLetterID_key" ON "mail.log"("providerLetterID");

-- CreateIndex
CREATE INDEX "mail.log_channel_idx" ON "mail.log"("channel");
