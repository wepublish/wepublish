-- CreateEnum
CREATE TYPE "PaymentMethodChangeKind" AS ENUM ('invoicePayment', 'authorization', 'immediate');

-- CreateEnum
CREATE TYPE "PaymentMethodChangeState" AS ENUM ('pending', 'completed', 'failed', 'expired', 'canceled');

-- CreateTable
CREATE TABLE "subscriptions.payment-method-changes" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "kind" "PaymentMethodChangeKind" NOT NULL,
    "state" "PaymentMethodChangeState" NOT NULL DEFAULT 'pending',
    "subscriptionID" TEXT NOT NULL,
    "fromPaymentMethodID" TEXT NOT NULL,
    "paymentMethodID" TEXT NOT NULL,
    "paymentID" TEXT,
    "intentID" TEXT,
    "intentSecret" TEXT,
    "intentData" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "subscriptions.payment-method-changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions.payment-method-changes_subscriptionID_state_idx" ON "subscriptions.payment-method-changes"("subscriptionID", "state");

-- CreateIndex
CREATE INDEX "subscriptions.payment-method-changes_intentID_idx" ON "subscriptions.payment-method-changes"("intentID");

-- CreateIndex
CREATE INDEX "subscriptions.payment-method-changes_paymentID_idx" ON "subscriptions.payment-method-changes"("paymentID");

-- AddForeignKey
ALTER TABLE "subscriptions.payment-method-changes" ADD CONSTRAINT "subscriptions.payment-method-changes_subscriptionID_fkey" FOREIGN KEY ("subscriptionID") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.payment-method-changes" ADD CONSTRAINT "subscriptions.payment-method-changes_fromPaymentMethodID_fkey" FOREIGN KEY ("fromPaymentMethodID") REFERENCES "payment.methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.payment-method-changes" ADD CONSTRAINT "subscriptions.payment-method-changes_paymentMethodID_fkey" FOREIGN KEY ("paymentMethodID") REFERENCES "payment.methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.payment-method-changes" ADD CONSTRAINT "subscriptions.payment-method-changes_paymentID_fkey" FOREIGN KEY ("paymentID") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Days a pending payment method change waits for the payment or authorization
INSERT INTO "settings" ("modifiedAt", "name", "value", "settingRestriction") VALUES (CURRENT_TIMESTAMP, 'paymentMethodChangeExpiryDays', '14'::jsonb, '{"minValue": 1, "maxValue": 90}'::jsonb) ON CONFLICT ("name") DO NOTHING;
