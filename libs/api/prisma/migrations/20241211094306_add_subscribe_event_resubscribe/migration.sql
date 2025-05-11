BEGIN;
ALTER TYPE "SubscriptionEvent" ADD VALUE 'CONFIRM_SUBSCRIPTION';
COMMIT;

INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId")
VALUES (
        CURRENT_TIMESTAMP,
        'CONFIRM_SUBSCRIPTION',
        NULL,
        (SELECT id FROM subscription_communication_flows WHERE "default" = true)
       );
