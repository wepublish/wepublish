-- AlterEnum
ALTER TYPE "SubscriptionDeactivationReason" ADD VALUE 'userReplacedSubscription';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "replacesSubscriptionID" TEXT;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_replacesSubscriptionID_fkey" FOREIGN KEY ("replacesSubscriptionID") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
