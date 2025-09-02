-- This is an empty migration.
INSERT INTO "pages" ("id", "modifiedAt", "publishedAt", "slug", "hidden") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '404', true);