-- AlterTable
-- IF NOT EXISTS: this migration first shipped as 20261102190000_bexio_test_mailbox,
-- so databases deployed from that version already have the column.
ALTER TABLE "settings.paymentprovider" ADD COLUMN IF NOT EXISTS "bexio_testMailbox" TEXT;
