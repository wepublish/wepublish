-- AlterTable
ALTER TABLE "discountCodes" ADD COLUMN     "minReferrals" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "referredByID" TEXT;

-- CreateIndex
CREATE INDEX "subscriptions_referredByID_idx" ON "subscriptions"("referredByID");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_referredByID_fkey" FOREIGN KEY ("referredByID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
