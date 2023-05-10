/*
  Warnings:

  - You are about to drop the column `sentReminderAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `mail.log` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mailIdentifier]` on the table `mail.log` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mailIdentifier` to the `mail.log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mailTemplateId` to the `mail.log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientID` to the `mail.log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentDate` to the `mail.log` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserEvent" AS ENUM ('ACCOUNT_CREATION', 'PASSWORD_RESET', 'LOGIN_LINK', 'TEST_MAIL');

-- CreateEnum
CREATE TYPE "SubscriptionEvent" AS ENUM ('SUBSCRIBE', 'INVOICE_CREATION', 'RENEWAL_SUCCESS', 'RENEWAL_FAILED', 'DEACTIVATION_UNPAID', 'DEACTIVATION_BY_USER', 'REACTIVATION', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_userID_fkey";

-- DropIndex
DROP INDEX "mail.log_subject_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "sentReminderAt",
DROP COLUMN "userID",
ADD COLUMN     "scheduledDeactivationAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "mail.log" DROP COLUMN "recipient",
ADD COLUMN     "mailIdentifier" TEXT NOT NULL,
ADD COLUMN     "mailTemplateId" UUID NOT NULL,
ADD COLUMN     "recipientID" TEXT NOT NULL,
ADD COLUMN     "sentDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "subject" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_communication_flows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "event" "UserEvent" NOT NULL,
    "mailTemplateId" UUID NOT NULL,

    CONSTRAINT "user_communication_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_communication_flows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "memberPlanId" TEXT,
    "periodicities" "PaymentPeriodicity"[],
    "autoRenewal" BOOLEAN[],

    CONSTRAINT "subscription_communication_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions.intervals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "event" "SubscriptionEvent" NOT NULL,
    "daysAwayFromEnding" SMALLINT,
    "mailTemplateId" UUID,
    "subscriptionFlowId" UUID NOT NULL,

    CONSTRAINT "subscriptions.intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalMailTemplateId" TEXT NOT NULL,
    "remoteMissing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mail_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodic_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "executionTime" TIMESTAMP(3),
    "successfullyFinished" TIMESTAMP(3),
    "finishedWithError" TIMESTAMP(3),
    "tries" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "periodic_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PaymentMethodToSubscriptionFlow" (
    "A" TEXT NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_communication_flows_event_key" ON "user_communication_flows"("event");

-- CreateIndex
CREATE UNIQUE INDEX "mail_templates_externalMailTemplateId_key" ON "mail_templates"("externalMailTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "periodic_jobs_date_key" ON "periodic_jobs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "_PaymentMethodToSubscriptionFlow_AB_unique" ON "_PaymentMethodToSubscriptionFlow"("A", "B");

-- CreateIndex
CREATE INDEX "_PaymentMethodToSubscriptionFlow_B_index" ON "_PaymentMethodToSubscriptionFlow"("B");

-- CreateIndex
CREATE UNIQUE INDEX "mail.log_mailIdentifier_key" ON "mail.log"("mailIdentifier");

-- CreateIndex
CREATE INDEX "mail.log_mailIdentifier_idx" ON "mail.log"("mailIdentifier");

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_subscriptionFlowId_fkey" FOREIGN KEY ("subscriptionFlowId") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_A_fkey" FOREIGN KEY ("A") REFERENCES "payment.methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_B_fkey" FOREIGN KEY ("B") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
