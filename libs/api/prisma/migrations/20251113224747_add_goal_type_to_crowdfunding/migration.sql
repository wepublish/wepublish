-- CreateEnum
CREATE TYPE "CrowdfundingGoalType" AS ENUM ('Revenue', 'Subscription');

-- AlterTable
ALTER TABLE "crowdfundings" ADD COLUMN     "goalType" "CrowdfundingGoalType" NOT NULL DEFAULT 'Revenue';
