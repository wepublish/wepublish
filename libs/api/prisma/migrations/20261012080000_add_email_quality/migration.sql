-- CreateEnum
CREATE TYPE "EmailQualityLevel" AS ENUM ('active', 'unknown', 'unresponsive', 'dead');

-- CreateEnum
CREATE TYPE "EmailQualityEventType" AS ENUM ('hardBounce', 'invalid', 'blocked', 'spamComplaint', 'unsubscribed', 'clicked', 'verified');

-- CreateEnum
CREATE TYPE "EmailQualityEventSource" AS ENUM ('send', 'webhook', 'poll', 'verification');

-- AlterTable
ALTER TABLE "mail.log" ADD COLUMN "recipientEmail" TEXT;

-- CreateTable
CREATE TABLE "email_quality_events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "EmailQualityEventType" NOT NULL,
    "source" "EmailQualityEventSource" NOT NULL,
    "detail" TEXT,
    "mailLogId" TEXT,
    "providerEventId" TEXT,

    CONSTRAINT "email_quality_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email_quality" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "level" "EmailQualityLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "since" TIMESTAMPTZ(3) NOT NULL,
    "lastEvaluatedAt" TIMESTAMPTZ(3) NOT NULL,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_email_quality_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_quality_events_mailLogId_type_key" ON "email_quality_events"("mailLogId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "email_quality_events_providerEventId_key" ON "email_quality_events"("providerEventId");

-- CreateIndex
CREATE INDEX "email_quality_events_userId_email_occurredAt_idx" ON "email_quality_events"("userId", "email", "occurredAt");

-- CreateIndex
CREATE INDEX "user_email_quality_level_idx" ON "user_email_quality"("level");

-- AddForeignKey
ALTER TABLE "email_quality_events" ADD CONSTRAINT "email_quality_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_email_quality" ADD CONSTRAINT "user_email_quality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- An address counts as unresponsive once this many mails were delivered to it,
-- the first of them this many days ago, without any login or click since.
INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'emailQualityUnresponsiveAfterDays', '180'::jsonb, '{"minValue": 1, "maxValue": 3650}'::jsonb) ON CONFLICT ("name") DO NOTHING;
INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'emailQualityMinMailsForUnresponsive', '1'::jsonb, '{"minValue": 1, "maxValue": 100}'::jsonb) ON CONFLICT ("name") DO NOTHING;
