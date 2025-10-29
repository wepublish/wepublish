-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('Subscription', 'Donation');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'Subscription';
