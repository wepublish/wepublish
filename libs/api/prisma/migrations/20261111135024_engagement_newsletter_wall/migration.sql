/*
  Warnings:

  - You are about to drop the column `newsletterParams` on the `engagement_rules` table. All the data in the column will be lost.
  - You are about to drop the column `newsletterReferral` on the `engagement_rules` table. All the data in the column will be lost.
  - You are about to drop the column `newsletterReferralLimit` on the `engagement_rules` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "EngagementRequirement" ADD VALUE 'NEWSLETTER';

-- AlterTable
ALTER TABLE "engagement_rules" DROP COLUMN "newsletterParams",
DROP COLUMN "newsletterReferral",
DROP COLUMN "newsletterReferralLimit";

-- DropEnum
DROP TYPE "NewsletterReferralMode";
