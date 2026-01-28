/*
  Warnings:

  - The primary key for the `banner_actions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `banners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `block-content.styles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `consents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crowdfunding_goals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crowdfundings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `events.tagged-events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `mail.log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `mail_templates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `periodic_jobs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscription_communication_flows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscriptions.intervals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user-consents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_communication_flows` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_BannerToPage" DROP CONSTRAINT "_BannerToPage_A_fkey";

-- DropForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" DROP CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" DROP CONSTRAINT "_PaymentMethodToSubscriptionFlow_B_fkey";

-- DropForeignKey
ALTER TABLE "banner_actions" DROP CONSTRAINT "banner_actions_bannerId_fkey";

-- DropForeignKey
ALTER TABLE "crowdfunding_goals" DROP CONSTRAINT "crowdfunding_goals_crowdfundingId_fkey";

-- DropForeignKey
ALTER TABLE "events.tagged-events" DROP CONSTRAINT "events.tagged-events_eventId_fkey";

-- DropForeignKey
ALTER TABLE "mail.log" DROP CONSTRAINT "mail.log_mailTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions.intervals" DROP CONSTRAINT "subscriptions.intervals_mailTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions.intervals" DROP CONSTRAINT "subscriptions.intervals_subscriptionFlowId_fkey";

-- DropForeignKey
ALTER TABLE "user-consents" DROP CONSTRAINT "user-consents_consentId_fkey";

-- DropForeignKey
ALTER TABLE "user_communication_flows" DROP CONSTRAINT "user_communication_flows_mailTemplateId_fkey";

-- AlterTable
ALTER TABLE "_BannerToPage" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_CrowdfundingToMemberPlan" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "banner_actions" DROP CONSTRAINT "banner_actions_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "bannerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "banner_actions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "banners" DROP CONSTRAINT "banners_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "banners_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "block-content.styles" DROP CONSTRAINT "block-content.styles_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "block-content.styles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "consents" DROP CONSTRAINT "consents_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "consents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "crowdfunding_goals" DROP CONSTRAINT "crowdfunding_goals_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "crowdfundingId" SET DATA TYPE TEXT,
ADD CONSTRAINT "crowdfunding_goals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "crowdfundings" DROP CONSTRAINT "crowdfundings_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "crowdfundings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "events.tagged-events" DROP CONSTRAINT "events.tagged-events_pkey",
ALTER COLUMN "eventId" SET DATA TYPE TEXT,
ADD CONSTRAINT "events.tagged-events_pkey" PRIMARY KEY ("eventId", "tagId");

-- AlterTable
ALTER TABLE "mail.log" DROP CONSTRAINT "mail.log_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "mailTemplateId" SET DATA TYPE TEXT,
ADD CONSTRAINT "mail.log_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "mail_templates" DROP CONSTRAINT "mail_templates_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "mail_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "periodic_jobs" DROP CONSTRAINT "periodic_jobs_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "periodic_jobs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "subscription_communication_flows" DROP CONSTRAINT "subscription_communication_flows_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "subscription_communication_flows_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "subscriptions.intervals" DROP CONSTRAINT "subscriptions.intervals_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "mailTemplateId" SET DATA TYPE TEXT,
ALTER COLUMN "subscriptionFlowId" SET DATA TYPE TEXT,
ADD CONSTRAINT "subscriptions.intervals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user-consents" DROP CONSTRAINT "user-consents_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "consentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user-consents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_communication_flows" DROP CONSTRAINT "user_communication_flows_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "mailTemplateId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_communication_flows_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events.tagged-events" ADD CONSTRAINT "events.tagged-events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-consents" ADD CONSTRAINT "user-consents_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.intervals" ADD CONSTRAINT "subscriptions.intervals_subscriptionFlowId_fkey" FOREIGN KEY ("subscriptionFlowId") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_actions" ADD CONSTRAINT "banner_actions_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crowdfunding_goals" ADD CONSTRAINT "crowdfunding_goals_crowdfundingId_fkey" FOREIGN KEY ("crowdfundingId") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentMethodToSubscriptionFlow" ADD CONSTRAINT "_PaymentMethodToSubscriptionFlow_B_fkey" FOREIGN KEY ("B") REFERENCES "subscription_communication_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToPage" ADD CONSTRAINT "_BannerToPage_A_fkey" FOREIGN KEY ("A") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
