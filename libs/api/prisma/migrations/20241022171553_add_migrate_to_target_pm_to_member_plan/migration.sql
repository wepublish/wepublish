-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "migrateToTargetPMid" TEXT;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_migrateToTargetPMid_fkey" FOREIGN KEY ("migrateToTargetPMid") REFERENCES "payment.methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
