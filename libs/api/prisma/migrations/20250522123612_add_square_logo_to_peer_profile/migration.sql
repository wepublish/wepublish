-- AlterTable
ALTER TABLE "peerProfiles" ADD COLUMN     "squareLogoId" TEXT;

-- AddForeignKey
ALTER TABLE "peerProfiles" ADD CONSTRAINT "peerProfiles_squareLogoId_fkey" FOREIGN KEY ("squareLogoId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
