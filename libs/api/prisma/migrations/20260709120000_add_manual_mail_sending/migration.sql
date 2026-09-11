-- CreateEnum
CREATE TYPE "MailLogType" AS ENUM ('subscriptionFlow', 'userFlow', 'systemMail', 'manual');

-- CreateEnum
CREATE TYPE "MailSendJobState" AS ENUM ('queued', 'running', 'done', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "MailSendAudience" AS ENUM ('singleUser', 'filteredSubscriptions', 'allUsers');

-- AlterTable
ALTER TABLE "mail.log" ADD COLUMN     "type" "MailLogType",
ADD COLUMN     "mailSendJobId" TEXT;

-- CreateTable
CREATE TABLE "mail.send_jobs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "mailTemplateId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "MailSendJobState" NOT NULL DEFAULT 'queued',
    "audience" "MailSendAudience" NOT NULL,
    "recipientFilter" JSONB,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "mail.send_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail.send_jobs_status_idx" ON "mail.send_jobs"("status");

-- CreateIndex
CREATE INDEX "mail.log_mailSendJobId_idx" ON "mail.log"("mailSendJobId");

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_mailSendJobId_fkey" FOREIGN KEY ("mailSendJobId") REFERENCES "mail.send_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.send_jobs" ADD CONSTRAINT "mail.send_jobs_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.send_jobs" ADD CONSTRAINT "mail.send_jobs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
