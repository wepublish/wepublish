-- RenameTable
ALTER TABLE "Banner" RENAME TO "banners";

-- RenameTable
ALTER TABLE "BannerAction" RENAME TO "banner_actions";

-- AlterTable
ALTER TABLE "banner_actions" RENAME CONSTRAINT "BannerAction_pkey" TO "banner_actions_pkey";

-- AlterTable
ALTER TABLE "banners" RENAME CONSTRAINT "Banner_pkey" TO "banners_pkey";

-- RenameForeignKey
ALTER TABLE "banner_actions" RENAME CONSTRAINT "BannerAction_bannerId_fkey" TO "banner_actions_bannerId_fkey";

-- RenameForeignKey
ALTER TABLE "banners" RENAME CONSTRAINT "Banner_imageId_fkey" TO "banners_imageId_fkey";
