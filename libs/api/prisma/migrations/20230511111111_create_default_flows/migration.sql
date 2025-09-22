-- CreateFunction
CREATE OR REPLACE FUNCTION insert_default_subscription_flow() RETURNS void AS $$
DECLARE
  communication_flow_id UUID;
BEGIN
  IF (SELECT COUNT(*) FROM subscription_communication_flows WHERE "default" = true) = 0 THEN
    INSERT INTO subscription_communication_flows ("modifiedAt", "default", "memberPlanId", "periodicities", "autoRenewal") VALUES (CURRENT_TIMESTAMP, true, NULL, '{}', '{}') RETURNING id INTO communication_flow_id;
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'SUBSCRIBE', NULL, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'RENEWAL_SUCCESS', NULL, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'RENEWAL_FAILED', NULL, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'INVOICE_CREATION', -14, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'DEACTIVATION_UNPAID', 5, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'DEACTIVATION_BY_USER', NULL, communication_flow_id);
    INSERT INTO "subscriptions.intervals" ("modifiedAt", "event", "daysAwayFromEnding", "subscriptionFlowId") VALUES (CURRENT_TIMESTAMP, 'REACTIVATION', NULL, communication_flow_id);
  END IF;

  INSERT INTO user_communication_flows ("modifiedAt", "event") VALUES (CURRENT_TIMESTAMP, 'ACCOUNT_CREATION') ON CONFLICT ("event") DO NOTHING;
  INSERT INTO user_communication_flows ("modifiedAt", "event") VALUES (CURRENT_TIMESTAMP, 'LOGIN_LINK') ON CONFLICT ("event") DO NOTHING;
  INSERT INTO user_communication_flows ("modifiedAt", "event") VALUES (CURRENT_TIMESTAMP, 'PASSWORD_RESET') ON CONFLICT ("event") DO NOTHING;
  INSERT INTO user_communication_flows ("modifiedAt", "event") VALUES (CURRENT_TIMESTAMP, 'TEST_MAIL') ON CONFLICT ("event") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- RunFunction
SELECT insert_default_subscription_flow();

-- DropFunction
DROP FUNCTION insert_default_subscription_flow;
