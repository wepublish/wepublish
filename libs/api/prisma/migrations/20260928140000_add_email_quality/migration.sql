-- CreateEnum
CREATE TYPE "EmailQualityLevel" AS ENUM ('confirmed', 'unknown', 'unresponsive', 'suspect', 'undeliverable', 'blocked', 'placeholder');

-- CreateEnum
CREATE TYPE "EmailQualityEventType" AS ENUM ('placeholderDetected', 'hardBounce', 'softBounce', 'rejected', 'spamComplaint', 'unsubscribed', 'delivered', 'opened', 'clicked', 'jwtLogin', 'emailConfirmed', 'manualConfirmed', 'manualInvalid', 'manualReset', 'manualNote');

-- CreateEnum
CREATE TYPE "EmailQualityEventSource" AS ENUM ('send', 'webhook', 'poll', 'session', 'user', 'editor', 'backfill', 'evaluator');

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
    "createdById" TEXT,

    CONSTRAINT "email_quality_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email_quality" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "level" "EmailQualityLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "since" TIMESTAMPTZ(3) NOT NULL,
    "manualLevel" "EmailQualityLevel",
    "lastEvaluatedAt" TIMESTAMPTZ(3) NOT NULL,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_email_quality_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "email_quality_events_userId_email_occurredAt_idx" ON "email_quality_events"("userId", "email", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_quality_events_mailLogId_type_key" ON "email_quality_events"("mailLogId", "type");

-- CreateIndex
CREATE INDEX "user_email_quality_level_idx" ON "user_email_quality"("level");

-- AddForeignKey
ALTER TABLE "email_quality_events" ADD CONSTRAINT "email_quality_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_email_quality" ADD CONSTRAINT "user_email_quality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Default config: nothing is detected until an instance adds its patterns,
-- flow mails are only rerouted to paper once flowPaperMailEnabled is turned on.
INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'emailQuality', '{"placeholderPatterns": [], "importMarkerProperties": [], "flowPaperMailEnabled": false, "flowPaperMailLevels": ["placeholder", "undeliverable"], "flowSkipLevels": ["blocked"]}'::jsonb, NULL) ON CONFLICT ("name") DO NOTHING;
