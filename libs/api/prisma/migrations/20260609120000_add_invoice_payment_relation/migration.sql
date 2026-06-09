DELETE FROM "payments" WHERE "invoiceID" NOT IN (SELECT "id" FROM "invoices");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
