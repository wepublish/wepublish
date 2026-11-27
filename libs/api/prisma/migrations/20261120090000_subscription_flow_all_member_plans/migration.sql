-- A communication flow can be for the matching subscriptions of every member plan.
ALTER TABLE "subscription_communication_flows" ADD COLUMN "allMemberPlans" BOOLEAN NOT NULL DEFAULT false;
