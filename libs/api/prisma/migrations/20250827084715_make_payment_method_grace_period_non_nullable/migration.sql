-- AlterTable
UPDATE "payment.methods" SET "gracePeriod" = 0 WHERE "gracePeriod" IS NULL;
ALTER TABLE "payment.methods" ALTER COLUMN "gracePeriod" SET NOT NULL,
ALTER COLUMN "gracePeriod" SET DEFAULT 0;
