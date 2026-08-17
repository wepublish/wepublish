-- Rename table
ALTER TABLE "vouchers" RENAME TO "discountCodes";

-- Rename primary key (also renames the underlying index)
ALTER TABLE "discountCodes" RENAME CONSTRAINT "vouchers_pkey" TO "discountCodes_pkey";

-- Rename unique index
ALTER INDEX "vouchers_code_memberPlanId_key" RENAME TO "discountCodes_code_memberPlanId_key";

-- Rename foreign key to member.plans
ALTER TABLE "discountCodes" RENAME CONSTRAINT "vouchers_memberPlanId_fkey" TO "discountCodes_memberPlanId_fkey";

-- Rename check constraint
ALTER TABLE "discountCodes" RENAME CONSTRAINT "vouchers_discountPercent_check" TO "discountCodes_discountPercent_check";

-- Rename column and foreign key on invoices.items
ALTER TABLE "invoices.items" RENAME COLUMN "voucherId" TO "discountCodeId";
ALTER TABLE "invoices.items" RENAME CONSTRAINT "invoices.items_voucherId_fkey" TO "invoices.items_discountCodeId_fkey";
