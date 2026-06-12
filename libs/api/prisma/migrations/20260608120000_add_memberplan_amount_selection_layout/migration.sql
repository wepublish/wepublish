-- Add plan-owned amount picker configuration without changing existing plans.
CREATE TYPE "AmountSelectionLayout" AS ENUM ('Slider', 'Picker');

ALTER TABLE "member.plans"
  ADD COLUMN "amountSelectionLayout" "AmountSelectionLayout" NOT NULL DEFAULT 'Slider',
  ADD COLUMN "presetAmounts" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
