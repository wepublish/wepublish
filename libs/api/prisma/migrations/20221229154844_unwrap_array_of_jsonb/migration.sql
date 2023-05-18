-- Create function to migrate jsob[] to jsonb
CREATE OR REPLACE FUNCTION jsonb_array_to_jsonb(jsonb[]) RETURNS jsonb LANGUAGE SQL AS $$
    SELECT jsonb_object_agg(key, value)
    FROM unnest($1), jsonb_each(unnest)
$$;

-- Migrate article revision blocks from jsob[] to jsonb
ALTER TABLE "articles.revisions" ALTER COLUMN blocks TYPE jsonb USING jsonb_array_to_jsonb(blocks);
UPDATE "articles.revisions" set "blocks" = '[]' where blocks IS NULL;
ALTER TABLE "articles.revisions" ALTER COLUMN "blocks" SET NOT NULL;

-- Migrate page revision blocks from jsob[] to jsonb
ALTER TABLE "pages.revisions" ALTER COLUMN blocks TYPE jsonb USING jsonb_array_to_jsonb(blocks);
UPDATE "pages.revisions" set "blocks" = '[]' where blocks IS NULL;
ALTER TABLE "pages.revisions" ALTER COLUMN "blocks" SET NOT NULL;

-- Migrate author bio from jsob[] to jsonb
ALTER TABLE "authors" ALTER COLUMN bio TYPE jsonb USING jsonb_array_to_jsonb(bio);
UPDATE authors set "bio" = '[]' where bio IS NULL;
ALTER TABLE "authors" ALTER COLUMN "bio" SET NOT NULL;

-- Migrate member plans description from jsob[] to jsonb
ALTER TABLE "member.plans" ALTER COLUMN description TYPE jsonb USING jsonb_array_to_jsonb(description);
UPDATE "member.plans" set "description" = '[]' where description IS NULL;
ALTER TABLE "member.plans" ALTER COLUMN "description" SET NOT NULL;

-- Migrate peer profiles callToActionText from jsob[] to jsonb
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" TYPE jsonb USING jsonb_array_to_jsonb("callToActionText");
UPDATE "peerProfiles" set "callToActionText" = '[]' where "callToActionText" IS NULL;
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" SET NOT NULL;

-- Cleanup function
DROP FUNCTION jsonb_array_to_jsonb;
