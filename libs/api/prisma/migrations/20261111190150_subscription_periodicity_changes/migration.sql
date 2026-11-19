-- CreateTable
CREATE TABLE "subscriptions.periodicity-changes" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionID" TEXT NOT NULL,
    "fromPeriodicity" "PaymentPeriodicity" NOT NULL,
    "toPeriodicity" "PaymentPeriodicity" NOT NULL,
    "fromMonthlyAmount" DOUBLE PRECISION NOT NULL,
    "toMonthlyAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "subscriptions.periodicity-changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions.periodicity-changes_subscriptionID_idx" ON "subscriptions.periodicity-changes"("subscriptionID");

-- CreateIndex
CREATE INDEX "subscriptions.periodicity-changes_createdAt_idx" ON "subscriptions.periodicity-changes"("createdAt");

-- AddForeignKey
ALTER TABLE "subscriptions.periodicity-changes" ADD CONSTRAINT "subscriptions.periodicity-changes_subscriptionID_fkey" FOREIGN KEY ("subscriptionID") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

