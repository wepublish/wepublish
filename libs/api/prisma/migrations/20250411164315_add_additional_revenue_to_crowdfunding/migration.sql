-- AlterTable
ALTER TABLE "crowdfundings" ADD COLUMN     "additionalRevenue" INTEGER,
ADD COLUMN     "countSubscriptionsFrom" TIMESTAMP(3),
ADD COLUMN     "countSubscriptionsUntil" TIMESTAMP(3);
