-- CreateEnum
CREATE TYPE "NewsletterCampaignStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "newsletter_campaigns" ADD COLUMN     "status" "NewsletterCampaignStatus" NOT NULL DEFAULT 'active';
