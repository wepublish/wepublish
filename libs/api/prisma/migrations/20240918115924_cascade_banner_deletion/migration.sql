-- DropForeignKey
ALTER TABLE "BannerAction" DROP CONSTRAINT "BannerAction_bannerId_fkey";

-- AddForeignKey
ALTER TABLE "BannerAction" ADD CONSTRAINT "BannerAction_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
