-- CreateTable
CREATE TABLE "Crowdfunding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Crowdfunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrowdfundingGoal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" INTEGER NOT NULL,
    "crowdfundingId" UUID,

    CONSTRAINT "CrowdfundingGoal_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "CrowdfundingGoal" ADD CONSTRAINT "CrowdfundingGoal_crowdfundingId_fkey" FOREIGN KEY ("crowdfundingId") REFERENCES "Crowdfunding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "Crowdfunding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrowdfundingToMemberPlan" ADD CONSTRAINT "_CrowdfundingToMemberPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
