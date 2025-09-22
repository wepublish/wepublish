/*
  Warnings:

  - You are about to drop the column `tags` on the `banners` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BannerActionRole" AS ENUM ('primary', 'cancel', 'other');

-- AlterTable
ALTER TABLE "banner_actions" ADD COLUMN     "role" "BannerActionRole" NOT NULL DEFAULT 'other';

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "tags";
