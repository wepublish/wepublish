-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CHF', 'EUR');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "member.plans" ALTER COLUMN "currency" DROP DEFAULT;

