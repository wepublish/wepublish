-- AlterTable
ALTER TABLE "mail.log" ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "mail.log_subscriptionId_idx" ON "mail.log"("subscriptionId");

-- CreateIndex
CREATE INDEX "mail.log_invoiceId_idx" ON "mail.log"("invoiceId");

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Manual sends already know their subscription: the job's recipient row
-- carries it and points at the log entry it wrote. Flow mails sent before
-- this migration keep no trigger; guessing one from dates would be wrong
-- often enough to mislead.
UPDATE "mail.log" AS log
SET "subscriptionId" = recipient."subscriptionId"
FROM "mail.send_job_recipients" AS recipient
WHERE recipient."mailLogId" = log."id"
  AND recipient."subscriptionId" IS NOT NULL
  AND log."subscriptionId" IS NULL;
