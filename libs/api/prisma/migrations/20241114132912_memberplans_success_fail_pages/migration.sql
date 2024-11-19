-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "failPageId" TEXT,
ADD COLUMN     "successPageId" TEXT;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_successPageId_fkey" FOREIGN KEY ("successPageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_failPageId_fkey" FOREIGN KEY ("failPageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
