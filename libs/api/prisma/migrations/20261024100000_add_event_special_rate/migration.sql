-- CreateEnum
CREATE TYPE "EventSpecialRate" AS ENUM ('freeEntry', 'freePrice');

-- AlterTable
ALTER TABLE "events.events" ADD COLUMN     "specialRate" "EventSpecialRate";
