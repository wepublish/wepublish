-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "confirmationPageId" TEXT;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_confirmationPageId_fkey" FOREIGN KEY ("confirmationPageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
