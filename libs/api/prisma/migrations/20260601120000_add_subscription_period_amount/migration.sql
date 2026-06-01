-- Add nullable exact per-period amount (cents). Null falls back to monthlyAmount × months.
ALTER TABLE "subscriptions" ADD COLUMN "periodAmount" INTEGER;
