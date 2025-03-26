/*
  Warnings:

  - Made the column `crowdfundingId` on table `CrowdfundingGoal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CrowdfundingGoal" DROP CONSTRAINT "CrowdfundingGoal_crowdfundingId_fkey";

-- AlterTable
ALTER TABLE "CrowdfundingGoal" ALTER COLUMN "crowdfundingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CrowdfundingGoal" ADD CONSTRAINT "CrowdfundingGoal_crowdfundingId_fkey" FOREIGN KEY ("crowdfundingId") REFERENCES "Crowdfunding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CrowdfundingGoal" RENAME COLUMN "goal" TO "amount";
