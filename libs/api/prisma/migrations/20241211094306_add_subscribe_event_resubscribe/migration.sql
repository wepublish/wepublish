BEGIN;
ALTER TYPE "SubscriptionEvent" ADD VALUE 'RESUBSCRIBE';
COMMIT;

INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId")
VALUES (
        CURRENT_TIMESTAMP,
        'RESUBSCRIBE',
        NULL,
        (SELECT id FROM subscription_communication_flows WHERE "default" = true)
       );
