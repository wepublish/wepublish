-- Create function to migrate jsob[] to jsonb
CREATE OR REPLACE FUNCTION jsonb_array_to_jsonb(jsonb[]) RETURNS jsonb LANGUAGE SQL AS $$
    SELECT jsonb_object_agg(key, value)
    FROM unnest($1), jsonb_each(unnest)
$$;

-- Migrate article revision blocks from jsob[] to jsonb
ALTER TABLE "articles.revisions" ALTER COLUMN blocks TYPE jsonb USING jsonb_array_to_jsonb(blocks);

-- Migrate page revision blocks from jsob[] to jsonb
ALTER TABLE "pages.revisions" ALTER COLUMN blocks TYPE jsonb USING jsonb_array_to_jsonb(blocks);

-- Migrate author bio from jsob[] to jsonb
ALTER TABLE "authors" ALTER COLUMN bio TYPE jsonb USING jsonb_array_to_jsonb(bio);

-- Migrate member plans description from jsob[] to jsonb
ALTER TABLE "member.plans" ALTER COLUMN description TYPE jsonb USING jsonb_array_to_jsonb(description);

-- Migrate peer profiles callToActionText from jsob[] to jsonb
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" TYPE jsonb USING jsonb_array_to_jsonb("callToActionText");

-- Cleanup function
DROP FUNCTION jsonb_array_to_jsonb;
