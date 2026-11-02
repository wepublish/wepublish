-- CreateEnum
CREATE TYPE "DeliveryPreferenceOrigin" AS ENUM ('manual', 'suggestion');

-- CreateEnum
CREATE TYPE "DeliverySuggestionKind" AS ENUM ('toLetter', 'toMail');

-- AlterTable
ALTER TABLE "subscriptions.intervals" ADD COLUMN     "sendAsLetter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "settings.letterprovider" ADD COLUMN     "defaultAddressPosition" "LetterAddressPosition",
ADD COLUMN     "defaultDeliveryProduct" "LetterDeliveryProduct",
ADD COLUMN     "defaultPrintMode" "LetterPrintMode",
ADD COLUMN     "defaultPrintSpectrum" "LetterPrintSpectrum";

-- CreateTable
CREATE TABLE "user_delivery_preferences" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "channel" "MailChannel" NOT NULL,
    "origin" "DeliveryPreferenceOrigin" NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "changedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_delivery_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_delivery_suggestions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "DeliverySuggestionKind" NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "user_delivery_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_delivery_preferences_channel_origin_idx" ON "user_delivery_preferences"("channel", "origin");

-- CreateIndex
CREATE UNIQUE INDEX "user_delivery_suggestions_userId_key" ON "user_delivery_suggestions"("userId");

-- CreateIndex
CREATE INDEX "user_delivery_suggestions_kind_idx" ON "user_delivery_suggestions"("kind");

-- AddForeignKey
ALTER TABLE "user_delivery_preferences" ADD CONSTRAINT "user_delivery_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delivery_preferences" ADD CONSTRAINT "user_delivery_preferences_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delivery_suggestions" ADD CONSTRAINT "user_delivery_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

