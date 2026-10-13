-- AlterTable
ALTER TABLE "mail.log" ADD COLUMN     "mailProviderMessageID" TEXT;

-- CreateIndex
CREATE INDEX "mail.log_mailProviderMessageID_idx" ON "mail.log"("mailProviderMessageID");
