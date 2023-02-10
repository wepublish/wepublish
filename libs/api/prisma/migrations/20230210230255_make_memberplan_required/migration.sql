/*
  Warnings:

  - Made the column `memberPlanId` on table `subscription_communication_flows` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "subscription_communication_flows" DROP CONSTRAINT "subscription_communication_flows_memberPlanId_fkey";

-- AlterTable
ALTER TABLE "subscription_communication_flows" ALTER COLUMN "memberPlanId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "subscription_communication_flows" ADD CONSTRAINT "subscription_communication_flows_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
