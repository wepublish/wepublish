-- CreateEnum
CREATE TYPE "MailTemplateContext" AS ENUM ('account', 'emailChange', 'subscription', 'renewal', 'invoiceCreation', 'custom');

-- AlterTable
ALTER TABLE "mail_templates" ADD COLUMN "context" "MailTemplateContext";
