-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE 'crowdfunding';

-- CreateTable
CREATE TABLE "crowdfundings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "countSubscriptionsFrom" TIMESTAMP(3),
    "countSubscriptionsUntil" TIMESTAMP(3),
    "additionalRevenue" INTEGER,

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

-- CreateTable
CREATE TABLE "_CrowdfundingToMemberPlan" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CrowdfundingToMemberPlan_AB_unique" ON "_CrowdfundingToMemberPlan"("A", "B");

-- CreateIndex
CREATE INDEX "_CrowdfundingToMemberPlan_B_index" ON "_CrowdfundingToMemberPlan"("B");

-- AddForeignKey
ALTER TABLE "crowdfunding_goals" ADD CONSTRAINT "crowdfunding_goals_crowdfundingId_fkey" FOREIGN KEY ("crowdfundingId") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "crowdfundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
