-- A communication flow can be switched off; its subscriptions then fall to the next flow.
ALTER TABLE "subscription_communication_flows" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
