-- CreateEnum
CREATE TYPE "MailSendJobRecipientState" AS ENUM ('pending', 'sending', 'sent', 'failed');

-- AlterTable
ALTER TABLE "mail.send_jobs" ADD COLUMN     "sendingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recipientsResolvedAt" TIMESTAMP(3),
ADD COLUMN     "heartbeatAt" TIMESTAMP(3),
ADD COLUMN     "resumeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "mail.send_job_recipients" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "position" INTEGER NOT NULL,
    "state" "MailSendJobRecipientState" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "mailLogId" TEXT,

    CONSTRAINT "mail.send_job_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail.send_job_recipients_jobId_state_idx" ON "mail.send_job_recipients"("jobId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "mail.send_job_recipients_jobId_position_key" ON "mail.send_job_recipients"("jobId", "position");

-- AddForeignKey
ALTER TABLE "mail.send_job_recipients" ADD CONSTRAINT "mail.send_job_recipients_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "mail.send_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.send_job_recipients" ADD CONSTRAINT "mail.send_job_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.send_job_recipients" ADD CONSTRAINT "mail.send_job_recipients_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing jobs predate the queue: mark them resolved so the executor never
-- builds a queue for a send that already happened and mails everybody again.
UPDATE "mail.send_jobs" SET "recipientsResolvedAt" = "createdAt";

-- A job still in flight during the upgrade has no queue to continue from, and
-- re-running it would mail the recipients it already reached a second time.
-- Stop it instead and say so; the editor can start a fresh send.
UPDATE "mail.send_jobs"
SET "status" = 'failed',
    "finishedAt" = NOW(),
    "error" = 'Job was interrupted by an update of We.Publish. Please check the sent mails and start a new send for the remaining recipients.'
WHERE "status" IN ('queued', 'running');
