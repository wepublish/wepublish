-- AlterTable
ALTER TABLE "mail_templates" ADD COLUMN     "letterAppendixId" TEXT;

-- AddForeignKey
ALTER TABLE "mail_templates" ADD CONSTRAINT "mail_templates_letterAppendixId_fkey" FOREIGN KEY ("letterAppendixId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

