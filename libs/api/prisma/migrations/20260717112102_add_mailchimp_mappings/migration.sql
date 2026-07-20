-- AlterTable
ALTER TABLE "settings.syncprovider" ADD COLUMN     "firstnameFields" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "lastnameFields" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "mailchimp_mappings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "syncProviderId" TEXT NOT NULL,
    "memberPlanId" TEXT NOT NULL,
    "activeFieldIds" JSONB NOT NULL DEFAULT '[]',
    "retargetFieldIds" JSONB NOT NULL DEFAULT '[]',
    "retargetDelayDays" INTEGER NOT NULL DEFAULT 30,
    "interestGroupIds" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "mailchimp_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mailchimp_mappings_syncProviderId_memberPlanId_key" ON "mailchimp_mappings"("syncProviderId", "memberPlanId");

-- AddForeignKey
ALTER TABLE "mailchimp_mappings" ADD CONSTRAINT "mailchimp_mappings_syncProviderId_fkey" FOREIGN KEY ("syncProviderId") REFERENCES "settings.syncprovider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailchimp_mappings" ADD CONSTRAINT "mailchimp_mappings_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
