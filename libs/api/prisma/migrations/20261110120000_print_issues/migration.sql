-- CreateEnum
CREATE TYPE "PrintIssueStatus" AS ENUM ('open', 'closed', 'historic');

-- CreateEnum
CREATE TYPE "PrintIssueRecipientSource" AS ENUM ('wepublish', 'bexio');

-- CreateEnum
CREATE TYPE "PrintIssueRecipientReason" AS ENUM ('paid', 'openInvoice', 'grace', 'gift', 'external');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "printIssuesPerPeriod" INTEGER;

-- CreateTable
CREATE TABLE "print.issues" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "issueDate" DATE NOT NULL,
    "status" "PrintIssueStatus" NOT NULL DEFAULT 'open',
    "note" TEXT,
    "options" JSONB NOT NULL,
    "closedAt" TIMESTAMPTZ(3),
    "closedByUserId" TEXT,
    "pendingRun" JSONB,
    "pendingRunAt" TIMESTAMPTZ(3),
    "pendingRunByUserId" TEXT,

    CONSTRAINT "print.issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print.issue_deliveries" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "batch" INTEGER NOT NULL,
    "createdByUserId" TEXT,
    "options" JSONB NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "copyCount" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,
    "filename" TEXT NOT NULL,
    "deliveredAt" TIMESTAMPTZ(3),
    "deliveredByUserId" TEXT,

    CONSTRAINT "print.issue_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print.issue_recipients" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "batch" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "source" "PrintIssueRecipientSource" NOT NULL,
    "reason" "PrintIssueRecipientReason" NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "periodId" TEXT,
    "bexioInvoiceId" INTEGER,
    "bexioContactId" INTEGER,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "print.issue_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print.issues_issueDate_idx" ON "print.issues"("issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "print.issues_year_number_key" ON "print.issues"("year", "number");

-- CreateIndex
CREATE UNIQUE INDEX "print.issue_deliveries_issueId_batch_key" ON "print.issue_deliveries"("issueId", "batch");

-- CreateIndex
CREATE INDEX "print.issue_recipients_deliveryId_idx" ON "print.issue_recipients"("deliveryId");

-- CreateIndex
CREATE INDEX "print.issue_recipients_subscriptionId_idx" ON "print.issue_recipients"("subscriptionId");

-- CreateIndex
CREATE INDEX "print.issue_recipients_periodId_idx" ON "print.issue_recipients"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "print.issue_recipients_issueId_batch_position_key" ON "print.issue_recipients"("issueId", "batch", "position");

-- CreateIndex
CREATE UNIQUE INDEX "print.issue_recipients_issueId_subscriptionId_key" ON "print.issue_recipients"("issueId", "subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "print.issue_recipients_issueId_bexioInvoiceId_key" ON "print.issue_recipients"("issueId", "bexioInvoiceId");

-- AddForeignKey
ALTER TABLE "print.issues" ADD CONSTRAINT "print.issues_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issues" ADD CONSTRAINT "print.issues_pendingRunByUserId_fkey" FOREIGN KEY ("pendingRunByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_deliveries" ADD CONSTRAINT "print.issue_deliveries_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "print.issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_deliveries" ADD CONSTRAINT "print.issue_deliveries_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_deliveries" ADD CONSTRAINT "print.issue_deliveries_deliveredByUserId_fkey" FOREIGN KEY ("deliveredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_recipients" ADD CONSTRAINT "print.issue_recipients_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "print.issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_recipients" ADD CONSTRAINT "print.issue_recipients_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "print.issue_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_recipients" ADD CONSTRAINT "print.issue_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_recipients" ADD CONSTRAINT "print.issue_recipients_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_recipients" ADD CONSTRAINT "print.issue_recipients_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "subscriptions.periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Issues per year the medium prints; 0 keeps the owed-copies rule off until
-- the historic issues are imported (print export).
INSERT INTO "settings" ("modifiedAt", "name", "value", "settingRestriction") VALUES (CURRENT_TIMESTAMP, 'printIssuesPerYear', '0'::jsonb, '{"minValue": 0, "maxValue": 52}'::jsonb) ON CONFLICT ("name") DO NOTHING;

-- What a print issue's list is computed from, by default: every subscription
-- plan, bexio when a provider is set up, readers with an open renewal invoice,
-- no gift copies for subscriptions starting after the ship day.
INSERT INTO "settings" ("modifiedAt", "name", "value") VALUES (CURRENT_TIMESTAMP, 'printExportDefaults', '{"memberPlanIds": null, "includeBexio": true, "includeOpen": true, "includeUpcoming": false}'::jsonb) ON CONFLICT ("name") DO NOTHING;
