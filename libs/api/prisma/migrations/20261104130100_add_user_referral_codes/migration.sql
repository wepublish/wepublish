-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referralCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

