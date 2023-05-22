-- Migrate article revision blocks from jsob[] to jsonb
ALTER TABLE "articles.revisions" ALTER COLUMN "blocks" TYPE jsonb USING to_json("blocks");
UPDATE "articles.revisions" set "blocks" = '[]' where blocks IS NULL;
ALTER TABLE "articles.revisions" ALTER COLUMN "blocks" SET NOT NULL;

-- Migrate page revision blocks from jsob[] to jsonb
ALTER TABLE "pages.revisions" ALTER COLUMN "blocks" TYPE jsonb USING to_json("blocks");
UPDATE "pages.revisions" set "blocks" = '[]' where blocks IS NULL;
ALTER TABLE "pages.revisions" ALTER COLUMN "blocks" SET NOT NULL;

-- Migrate author bio from jsob[] to jsonb
ALTER TABLE "authors" ALTER COLUMN "bio" TYPE jsonb USING to_json("bio");
UPDATE authors set "bio" = '[]' where bio IS NULL;
ALTER TABLE "authors" ALTER COLUMN "bio" SET NOT NULL;

-- Migrate member plans description from jsob[] to jsonb
ALTER TABLE "member.plans" ALTER COLUMN "description" TYPE jsonb USING to_json("description");
UPDATE "member.plans" set "description" = '[]' where description IS NULL;
ALTER TABLE "member.plans" ALTER COLUMN "description" SET NOT NULL;

-- Migrate peer profiles callToActionText from jsob[] to jsonb
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" TYPE jsonb USING to_json("callToActionText");
UPDATE "peerProfiles" set "callToActionText" = '[]' where "callToActionText" IS NULL;
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" SET NOT NULL;
