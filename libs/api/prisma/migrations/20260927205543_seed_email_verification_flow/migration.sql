-- Seed UserFlowMail for EMAIL_VERIFICATION event
INSERT INTO "user_communication_flows" ("modifiedAt", "event")
VALUES (CURRENT_TIMESTAMP, 'EMAIL_VERIFICATION')
ON CONFLICT ("event") DO NOTHING;
