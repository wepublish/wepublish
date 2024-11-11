-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "migrateToTargetPaymentMethodID" TEXT;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_migrateToTargetPaymentMethodID_fkey" FOREIGN KEY ("migrateToTargetPaymentMethodID") REFERENCES "payment.methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
