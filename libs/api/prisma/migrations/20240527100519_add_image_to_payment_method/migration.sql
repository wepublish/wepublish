-- AlterTable
ALTER TABLE "payment.methods" ADD COLUMN     "imageId" TEXT;

-- AddForeignKey
ALTER TABLE "payment.methods" ADD CONSTRAINT "payment.methods_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
