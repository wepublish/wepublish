-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "manuallySetAsPaidByApiTokenId" TEXT;

-- AlterTable
ALTER TABLE "print.issue_deliveries" ADD COLUMN     "createdByApiTokenId" TEXT,
ADD COLUMN     "deliveredByApiTokenId" TEXT;

-- AlterTable
ALTER TABLE "print.issues" ADD COLUMN     "closedByApiTokenId" TEXT,
ADD COLUMN     "pendingRunByApiTokenId" TEXT;

-- AlterTable
ALTER TABLE "user_delivery_bulk_changes" ADD COLUMN     "changedByApiTokenId" TEXT;

-- AlterTable
ALTER TABLE "user_delivery_preferences" ADD COLUMN     "changedByApiTokenId" TEXT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_manuallySetAsPaidByApiTokenId_fkey" FOREIGN KEY ("manuallySetAsPaidByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delivery_preferences" ADD CONSTRAINT "user_delivery_preferences_changedByApiTokenId_fkey" FOREIGN KEY ("changedByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delivery_bulk_changes" ADD CONSTRAINT "user_delivery_bulk_changes_changedByApiTokenId_fkey" FOREIGN KEY ("changedByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issues" ADD CONSTRAINT "print.issues_closedByApiTokenId_fkey" FOREIGN KEY ("closedByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issues" ADD CONSTRAINT "print.issues_pendingRunByApiTokenId_fkey" FOREIGN KEY ("pendingRunByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_deliveries" ADD CONSTRAINT "print.issue_deliveries_createdByApiTokenId_fkey" FOREIGN KEY ("createdByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print.issue_deliveries" ADD CONSTRAINT "print.issue_deliveries_deliveredByApiTokenId_fkey" FOREIGN KEY ("deliveredByApiTokenId") REFERENCES "api-tokens.tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
