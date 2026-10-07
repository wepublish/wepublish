-- All member plan pricing moves into "member.plans.periodicity-prices"; the
-- monthly base price becomes a monthly row. No down-migration: the dropped
-- columns survive only as monthly rows.

-- Backfill: every plan gets a monthly base row from the legacy columns.
-- Existing monthly rows (label-only under the old rules) are merged, never
-- overwritten.
INSERT INTO "member.plans.periodicity-prices"
  ("modifiedAt", "periodicity", "amountMin", "amountTarget", "amountMax", "memberPlanId")
SELECT
  CURRENT_TIMESTAMP,
  'monthly'::"PaymentPeriodicity",
  ROUND(mp."amountPerMonthMin")::INTEGER,
  ROUND(mp."amountPerMonthTarget")::INTEGER,
  ROUND(mp."amountPerMonthMax")::INTEGER,
  mp."id"
FROM "member.plans" mp
ON CONFLICT ("memberPlanId", "periodicity") DO UPDATE SET
  "amountMin"    = COALESCE("member.plans.periodicity-prices"."amountMin",    EXCLUDED."amountMin"),
  "amountTarget" = COALESCE("member.plans.periodicity-prices"."amountTarget", EXCLUDED."amountTarget"),
  "amountMax"    = COALESCE("member.plans.periodicity-prices"."amountMax",    EXCLUDED."amountMax"),
  "modifiedAt"   = CURRENT_TIMESTAMP;

-- Belt: no plan may leave this migration without a priced monthly row.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "member.plans" mp
    WHERE NOT EXISTS (
      SELECT 1 FROM "member.plans.periodicity-prices" pp
      WHERE pp."memberPlanId" = mp."id"
        AND pp."periodicity" = 'monthly'
        AND pp."amountMin" IS NOT NULL
    )
  ) THEN
    RAISE EXCEPTION 'member plan without monthly price row after backfill';
  END IF;
END $$;

-- Drop the legacy ordering constraint together with its columns.
ALTER TABLE "member.plans" DROP CONSTRAINT IF EXISTS check_target_greater_than_min;

-- AlterTable
ALTER TABLE "member.plans"
  DROP COLUMN "amountPerMonthMin",
  DROP COLUMN "amountPerMonthMax",
  DROP COLUMN "amountPerMonthTarget";
