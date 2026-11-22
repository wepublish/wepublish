-- AlterTable
ALTER TABLE "subscription_communication_flows" ADD COLUMN     "legacy" BOOLEAN[] DEFAULT ARRAY[true, false]::BOOLEAN[];
