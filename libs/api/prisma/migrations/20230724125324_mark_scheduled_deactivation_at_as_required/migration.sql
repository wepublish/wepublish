-- Data manipulation to ensure migration to work
UPDATE "invoices" SET "scheduledDeactivationAt" = "dueAt" + INTERVAL '14 days' WHERE "scheduledDeactivationAt" IS NULL;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "scheduledDeactivationAt" SET NOT NULL;
