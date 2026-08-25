-- CreateEnum
CREATE TYPE "LetterAddressPosition" AS ENUM ('left', 'right');

-- CreateEnum
CREATE TYPE "LetterDeliveryProduct" AS ENUM ('fast', 'cheap', 'bulk', 'premium', 'registered');

-- CreateEnum
CREATE TYPE "LetterPrintMode" AS ENUM ('simplex', 'duplex');

-- CreateEnum
CREATE TYPE "LetterPrintSpectrum" AS ENUM ('color', 'grayscale');

-- CreateEnum
CREATE TYPE "LetterQrBill" AS ENUM ('none', 'lastPage');

-- CreateEnum
CREATE TYPE "LetterLogState" AS ENUM ('pending', 'submitted', 'accepted', 'dispatched', 'delivered', 'undeliverable', 'rejected', 'canceled');

-- CreateEnum
CREATE TYPE "LetterLogType" AS ENUM ('subscriptionFlow', 'userFlow', 'manual');

-- CreateEnum
CREATE TYPE "LetterJobState" AS ENUM ('queued', 'running', 'done', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "QrBillReferenceType" AS ENUM ('qrr', 'scor', 'non');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "number" SERIAL NOT NULL,
ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "subscriptions.intervals" ADD COLUMN     "letterTemplateId" TEXT;

-- AlterTable
ALTER TABLE "user_communication_flows" ADD COLUMN     "letterTemplateId" TEXT;

-- CreateTable
CREATE TABLE "letter_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "htmlContent" TEXT NOT NULL DEFAULT '',
    "context" "MailTemplateContext",
    "addressPosition" "LetterAddressPosition" NOT NULL DEFAULT 'left',
    "deliveryProduct" "LetterDeliveryProduct" NOT NULL DEFAULT 'cheap',
    "printMode" "LetterPrintMode" NOT NULL DEFAULT 'simplex',
    "printSpectrum" "LetterPrintSpectrum" NOT NULL DEFAULT 'grayscale',
    "qrBill" "LetterQrBill" NOT NULL DEFAULT 'none',

CONSTRAINT "letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter.log" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "recipientID" TEXT NOT NULL,
    "letterTemplateId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "state" "LetterLogState" NOT NULL,
    "type" "LetterLogType" NOT NULL,
    "letterIdentifier" TEXT NOT NULL,
    "providerID" TEXT NOT NULL,
    "providerLetterID" TEXT,
    "addressSnapshot" JSONB NOT NULL,
    "sentDate" TIMESTAMPTZ(3),
    "pageCount" INTEGER,
    "priceValue" DECIMAL(10,2),
    "priceCurrency" TEXT,
    "trackingNumber" TEXT,
    "letterData" TEXT,
    "error" TEXT,

CONSTRAINT "letter.log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter.jobs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "state" "LetterJobState" NOT NULL DEFAULT 'queued',
    "letterTemplateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "letterIdentifier" TEXT NOT NULL,
    "type" "LetterLogType" NOT NULL,
    "daysAwayFromEnding" SMALLINT,
    "runDate" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "heartbeatAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "letterLogId" TEXT,

CONSTRAINT "letter.jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.organisation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastLoadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "street" TEXT,
    "number" TEXT,
    "zip" TEXT,
    "city" TEXT,
    "country" TEXT,
    "iban" TEXT,
    "referenceType" "QrBillReferenceType" NOT NULL DEFAULT 'qrr',

CONSTRAINT "settings.organisation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter.log_letterIdentifier_key" ON "letter.log"("letterIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "letter.log_providerLetterID_key" ON "letter.log"("providerLetterID");

-- CreateIndex
CREATE INDEX "letter.log_recipientID_createdAt_idx" ON "letter.log"("recipientID", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "letter.log_state_idx" ON "letter.log"("state");

-- CreateIndex
CREATE UNIQUE INDEX "letter.jobs_letterIdentifier_key" ON "letter.jobs"("letterIdentifier");

-- CreateIndex
CREATE INDEX "letter.jobs_state_idx" ON "letter.jobs"("state");

-- CreateIndex
CREATE INDEX "letter.jobs_userId_idx" ON "letter.jobs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentReference_key" ON "invoices"("paymentReference");

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_letterTemplateId_fkey" FOREIGN KEY ("letterTemplateId") REFERENCES "letter_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_letterTemplateId_fkey" FOREIGN KEY ("letterTemplateId") REFERENCES "letter_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.log" ADD CONSTRAINT "letter.log_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.log" ADD CONSTRAINT "letter.log_letterTemplateId_fkey" FOREIGN KEY ("letterTemplateId") REFERENCES "letter_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.log" ADD CONSTRAINT "letter.log_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.jobs" ADD CONSTRAINT "letter.jobs_letterTemplateId_fkey" FOREIGN KEY ("letterTemplateId") REFERENCES "letter_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.jobs" ADD CONSTRAINT "letter.jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.jobs" ADD CONSTRAINT "letter.jobs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter.jobs" ADD CONSTRAINT "letter.jobs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
