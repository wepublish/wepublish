-- bexio copies go to each linked recipient of an invoice: one row per invoice and recipient
-- DropIndex
DROP INDEX "print.issue_recipients_issueId_bexioInvoiceId_key";

-- AlterTable
ALTER TABLE "print.issue_recipients" ADD COLUMN     "bexioPeriodFrom" DATE,
ADD COLUMN     "bexioPeriodTo" DATE;

-- CreateIndex
CREATE UNIQUE INDEX "print.issue_recipients_issueId_bexioInvoiceId_bexioContactId_key" ON "print.issue_recipients"("issueId", "bexioInvoiceId", "bexioContactId");

-- The medium's bexio kinds: none until configured (Einstellungen › Druckausgaben)
INSERT INTO "settings" ("modifiedAt", "name", "value") VALUES (CURRENT_TIMESTAMP, 'printBexioKinds', '[]'::jsonb) ON CONFLICT ("name") DO NOTHING;
