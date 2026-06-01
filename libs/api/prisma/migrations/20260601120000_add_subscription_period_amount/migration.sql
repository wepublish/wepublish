-- Add nullable exact per-period amount (cents). Null falls back to monthlyAmount × months.
ALTER TABLE "subscriptions" ADD COLUMN "periodAmount" INTEGER;

-- Add nullable exact yearly price (cents) to member plans for fixed/discount yearly pricing.
ALTER TABLE "member.plans" ADD COLUMN "yearlyAmount" INTEGER;
