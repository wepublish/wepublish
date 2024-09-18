-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CHF', 'EUR');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CHF';
ALTER TABLE "invoices" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CHF';
ALTER TABLE "subscriptions" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "member.plans" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "currency" DROP DEFAULT;

