-- One-off data migration (ops, not a Prisma migration).
-- Moves synthetic placeholder addresses from the unregistered public domain
-- to a subdomain the publisher controls (null MX, SPF -all, DMARC reject),
-- so nobody else can ever receive mail for these accounts.
--
-- Prerequisites, in this order:
--   1. DNS for the target subdomain: MX 0 . / TXT "v=spf1 -all" / DMARC p=reject. Never host a mailbox.
--   2. Set SettingLetterProvider.placeholderEmailContains to the NEW domain (editor: Integrations → Letter).
--   3. Update the importer (importers/zwoelf/extract.ts, makeSyntheticEmail) to emit the new domain.
--   4. Run this script inside a transaction and verify the counts before COMMIT.
--
-- Adjust the two domains below before running.

BEGIN;

\set old_domain 'email-an-zwoelf.ch'
\set new_domain 'platzhalter.zwoelf.ch'

SELECT count(*) AS users_to_migrate
FROM "users"
WHERE "email" ILIKE '%@' || :'old_domain';

UPDATE "users"
SET "email" = regexp_replace("email", '@' || :'old_domain' || '$', '@' || :'new_domain', 'i')
WHERE "email" ILIKE '%@' || :'old_domain';

UPDATE "users"
SET "pendingEmail" = regexp_replace("pendingEmail", '@' || :'old_domain' || '$', '@' || :'new_domain', 'i')
WHERE "pendingEmail" ILIKE '%@' || :'old_domain';

SELECT count(*) AS users_still_on_old_domain
FROM "users"
WHERE "email" ILIKE '%@' || :'old_domain';

-- COMMIT only if users_still_on_old_domain = 0 and users_to_migrate matched expectations.
-- ROLLBACK otherwise.
COMMIT;
