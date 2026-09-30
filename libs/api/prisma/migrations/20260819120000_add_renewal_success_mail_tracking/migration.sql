-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "renewalSuccessMailSentAt" TIMESTAMPTZ(3),
ADD COLUMN     "suppressRenewalSuccessMail" BOOLEAN NOT NULL DEFAULT false;
