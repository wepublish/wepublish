-- Seed UserFlowMail for EMAIL_CHANGE event
INSERT INTO "user_communication_flows" ("modifiedAt", "event")
VALUES (CURRENT_TIMESTAMP, 'EMAIL_CHANGE')
ON CONFLICT ("event") DO NOTHING;
