-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "extendable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxCount" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "extendable" BOOLEAN NOT NULL DEFAULT true;

-- Add constraint
ALTER TABLE "subscriptions"
    ADD CONSTRAINT "check_extendable_autorenew"
        CHECK ("extendable" OR NOT "autoRenew");