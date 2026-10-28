-- Engagement rules for readers with a subscription to specific member plans.

-- AlterEnum
ALTER TYPE "EngagementAudience" ADD VALUE 'MEMBER_PLANS';

-- CreateTable
CREATE TABLE "_EngagementRuleAudienceMemberPlans" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EngagementRuleAudienceMemberPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EngagementRuleAudienceMemberPlans_B_index" ON "_EngagementRuleAudienceMemberPlans"("B");

-- AddForeignKey
ALTER TABLE "_EngagementRuleAudienceMemberPlans" ADD CONSTRAINT "_EngagementRuleAudienceMemberPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "engagement_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EngagementRuleAudienceMemberPlans" ADD CONSTRAINT "_EngagementRuleAudienceMemberPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

