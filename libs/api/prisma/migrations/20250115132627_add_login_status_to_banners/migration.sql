-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('logged_in', 'logged_out', 'all');

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "showForLoginStatus" "LoginStatus" NOT NULL DEFAULT 'all';
