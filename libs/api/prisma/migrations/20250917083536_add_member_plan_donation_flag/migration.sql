-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SUBSCRIPTION', 'DONATION');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'SUBSCRIPTION';
