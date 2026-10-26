-- CreateEnum
CREATE TYPE "SellableKind" AS ENUM ('gift-code');

-- CreateEnum
CREATE TYPE "GiftCodeCancellationReason" AS ENUM ('manual', 'chargeback', 'invoice-canceled');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "userID" TEXT;

-- AlterTable
ALTER TABLE "invoices.items" ADD COLUMN     "fulfilledAt" TIMESTAMPTZ(3),
ADD COLUMN     "revokedAt" TIMESTAMPTZ(3),
ADD COLUMN     "sellableKind" "SellableKind";

-- CreateTable
CREATE TABLE "gift-codes.offers" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "imageID" TEXT,
    "memberPlanId" TEXT NOT NULL,
    "periodicity" "PaymentPeriodicity" NOT NULL,
    "redemptionWindowMonths" INTEGER,
    "issueBeforePayment" BOOLEAN NOT NULL DEFAULT false,
    "allowDiscountCodes" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gift-codes.offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift-codes" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "code" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "memberPlanId" TEXT NOT NULL,
    "periodicity" "PaymentPeriodicity" NOT NULL,
    "redemptionWindowMonths" INTEGER,
    "invoiceItemId" TEXT NOT NULL,
    "buyerId" TEXT,
    "recipientName" TEXT NOT NULL,
    "message" TEXT,
    "issuedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "canceledAt" TIMESTAMPTZ(3),
    "cancellationReason" "GiftCodeCancellationReason",
    "canceledByUserId" TEXT,
    "redeemedAt" TIMESTAMPTZ(3),
    "redeemedByUserId" TEXT,
    "redeemedSubscriptionId" TEXT,

    CONSTRAINT "gift-codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GiftCodeOfferToPaymentMethod" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GiftCodeOfferToPaymentMethod_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift-codes.offers_memberPlanId_key" ON "gift-codes.offers"("memberPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "gift-codes_code_key" ON "gift-codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gift-codes_invoiceItemId_key" ON "gift-codes"("invoiceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "gift-codes_redeemedSubscriptionId_key" ON "gift-codes"("redeemedSubscriptionId");

-- CreateIndex
CREATE INDEX "gift-codes_buyerId_idx" ON "gift-codes"("buyerId");

-- CreateIndex
CREATE INDEX "gift-codes_offerId_idx" ON "gift-codes"("offerId");

-- CreateIndex
CREATE INDEX "gift-codes_memberPlanId_idx" ON "gift-codes"("memberPlanId");

-- CreateIndex
CREATE INDEX "gift-codes_issuedAt_idx" ON "gift-codes"("issuedAt");

-- CreateIndex
CREATE INDEX "_GiftCodeOfferToPaymentMethod_B_index" ON "_GiftCodeOfferToPaymentMethod"("B");

-- CreateIndex
CREATE INDEX "invoices_userID_idx" ON "invoices"("userID");

-- CreateIndex
CREATE INDEX "invoices.items_sellableKind_idx" ON "invoices.items"("sellableKind");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCodeOfferToPaymentMethod" ADD CONSTRAINT "_GiftCodeOfferToPaymentMethod_A_fkey" FOREIGN KEY ("A") REFERENCES "gift-codes.offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCodeOfferToPaymentMethod" ADD CONSTRAINT "_GiftCodeOfferToPaymentMethod_B_fkey" FOREIGN KEY ("B") REFERENCES "payment.methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "gift-codes.offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "invoices.items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redeemedSubscriptionId_fkey" FOREIGN KEY ("redeemedSubscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_redemptionWindowMonths_check" CHECK ("redemptionWindowMonths" IS NULL OR "redemptionWindowMonths" > 0);

-- AddConstraint
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redemptionWindowMonths_check" CHECK ("redemptionWindowMonths" IS NULL OR "redemptionWindowMonths" > 0);

-- AddConstraint
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_code_format_check" CHECK ("code" ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$');

-- AddConstraint
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redeemed_requires_issued_check" CHECK ("redeemedAt" IS NULL OR "issuedAt" IS NOT NULL);

-- AddConstraint
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_cancel_reason_check" CHECK (("canceledAt" IS NULL) = ("cancellationReason" IS NULL));

-- AddConstraint
ALTER TABLE "invoices.items" ADD CONSTRAINT "invoices.items_claim_requires_kind_check" CHECK (("fulfilledAt" IS NULL AND "revokedAt" IS NULL) OR "sellableKind" IS NOT NULL);
