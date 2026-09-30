-- Seed UserFlowMail for NEWSLETTER_CONFIRMATION event
INSERT INTO "user_communication_flows" ("modifiedAt", "event")
VALUES (CURRENT_TIMESTAMP, 'NEWSLETTER_CONFIRMATION')
ON CONFLICT ("event") DO NOTHING;
