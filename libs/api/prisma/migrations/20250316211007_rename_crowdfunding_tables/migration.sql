/*
  Warnings:

  - You are about to drop the `Crowdfunding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrowdfundingGoal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CrowdfundingGoal" DROP CONSTRAINT "CrowdfundingGoal_crowdfundingId_fkey";

-- DropForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" DROP CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey";

-- DropTable
DROP TABLE "Crowdfunding";

-- DropTable
DROP TABLE "CrowdfundingGoal";

-- CreateTable
CREATE TABLE "crowdfundings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "crowdfundings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crowdfunding_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "crowdfundingId" UUID NOT NULL,

    CONSTRAINT "crowdfunding_goals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "crowdfunding_goals" ADD CONSTRAINT "crowdfunding_goals_crowdfundingId_fkey" FOREIGN KEY ("crowdfundingId") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
