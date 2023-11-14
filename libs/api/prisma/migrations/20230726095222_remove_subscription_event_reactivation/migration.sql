
BEGIN;
-- Remove all now unused reactivation events
DELETE FROM "subscriptions.intervals" WHERE "event"='REACTIVATION';
-- AlterEnum
CREATE TYPE "SubscriptionEvent_new" AS ENUM ('SUBSCRIBE', 'INVOICE_CREATION', 'RENEWAL_SUCCESS', 'RENEWAL_FAILED', 'DEACTIVATION_UNPAID', 'DEACTIVATION_BY_USER', 'CUSTOM');
ALTER TABLE "subscriptions.intervals" ALTER COLUMN "event" TYPE "SubscriptionEvent_new" USING ("event"::text::"SubscriptionEvent_new");
ALTER TYPE "SubscriptionEvent" RENAME TO "SubscriptionEvent_old";
ALTER TYPE "SubscriptionEvent_new" RENAME TO "SubscriptionEvent";
DROP TYPE "SubscriptionEvent_old";
COMMIT;
