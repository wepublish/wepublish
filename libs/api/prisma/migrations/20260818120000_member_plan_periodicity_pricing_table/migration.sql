-- CreateTable
CREATE TABLE "member.plans.periodicity-prices" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "periodicity" "PaymentPeriodicity" NOT NULL,
    "label" TEXT,
    "amountMin" INTEGER,
    "amountTarget" INTEGER,
    "amountMax" INTEGER,
    "memberPlanId" TEXT NOT NULL,

    CONSTRAINT "member.plans.periodicity-prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member.plans.periodicity-prices_memberPlanId_periodicity_key" ON "member.plans.periodicity-prices"("memberPlanId", "periodicity");

-- AddForeignKey
ALTER TABLE "member.plans.periodicity-prices" ADD CONSTRAINT "member.plans.periodicity-prices_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: copy existing JSONB entries into the new table
INSERT INTO "member.plans.periodicity-prices"
    ("modifiedAt", "periodicity", "label", "amountMin", "amountTarget", "amountMax", "memberPlanId")
SELECT
    CURRENT_TIMESTAMP,
    (price->>'periodicity')::"PaymentPeriodicity",
    price->>'label',
    (price->>'amountMin')::INTEGER,
    (price->>'amountTarget')::INTEGER,
    (price->>'amountMax')::INTEGER,
    mp."id"
FROM "member.plans" mp
CROSS JOIN LATERAL jsonb_array_elements(mp."periodicityPricing") AS price
WHERE jsonb_typeof(mp."periodicityPricing") = 'array'
  AND jsonb_typeof(price) = 'object'
  AND price->>'periodicity' IN ('monthly','quarterly','biannual','yearly','biennial','lifetime');

-- AlterTable
ALTER TABLE "member.plans" DROP COLUMN "periodicityPricing";
