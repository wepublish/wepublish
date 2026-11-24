-- AlterEnum
-- A new enum value cannot be used in the transaction that adds it, which is
-- why the rows are moved over in the next migration.
ALTER TYPE "MailLogState" ADD VALUE 'actionRequired';
