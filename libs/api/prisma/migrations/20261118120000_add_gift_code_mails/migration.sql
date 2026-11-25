-- AlterEnum
ALTER TYPE "MailLogType" ADD VALUE 'giftCode';

-- AlterEnum
ALTER TYPE "MailTemplateContext" ADD VALUE 'giftCodePurchase';
ALTER TYPE "MailTemplateContext" ADD VALUE 'giftCodeRedemption';

-- AlterTable
ALTER TABLE "gift-codes.offers" ADD COLUMN     "purchaseMailTemplateId" TEXT,
ADD COLUMN     "redemptionMailTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_purchaseMailTemplateId_fkey" FOREIGN KEY ("purchaseMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_redemptionMailTemplateId_fkey" FOREIGN KEY ("redemptionMailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
