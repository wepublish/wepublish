-- Login codes ({{purl}}, {{purlCode}}, {{purlQr}}) are opt-in per medium.
INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction")
VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'loginCodeEnabled', 'false'::jsonb, '{"allowedValues": {"boolChoice": true}}'::jsonb)
ON CONFLICT ("name") DO NOTHING;
