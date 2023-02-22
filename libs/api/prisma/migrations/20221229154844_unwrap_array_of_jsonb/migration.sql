-- Migrate article revision blocks from jsob[] to jsonb
ALTER TABLE "articles.revisions" ADD COLUMN "blocks2" JSONB;

UPDATE "articles.revisions"
SET blocks2 = jsonBlocks
FROM (
    SELECT jsonb_agg(j::jsonb)
    FROM (
        SELECT unnest(blocks)
        FROM "articles.revisions"
    ) as x(j)
) as x(jsonBlocks);

ALTER TABLE "articles.revisions" ALTER COLUMN "blocks2" SET NOT NULL;
ALTER TABLE "articles.revisions" DROP COLUMN "blocks";
ALTER TABLE "articles.revisions" RENAME COLUMN "blocks2" TO "blocks";

-- Migrate page revision blocks from jsob[] to jsonb
ALTER TABLE "pages.revisions" ADD COLUMN "blocks2" JSONB;

UPDATE "pages.revisions"
SET blocks2 = jsonBlocks
FROM (
    SELECT jsonb_agg(j::jsonb)
    FROM (
        SELECT unnest(blocks)
        FROM "pages.revisions"
    ) as x(j)
) as x(jsonBlocks);

ALTER TABLE "pages.revisions" ALTER COLUMN "blocks2" SET NOT NULL;
ALTER TABLE "pages.revisions" DROP COLUMN "blocks";
ALTER TABLE "pages.revisions" RENAME COLUMN "blocks2" TO "blocks";

-- Migrate author bio from jsob[] to jsonb
ALTER TABLE "authors" ADD COLUMN "bio2" JSONB;

UPDATE "authors"
SET bio2 = jsonBio
FROM (
    SELECT jsonb_agg(j::jsonb)
    FROM (
        SELECT unnest(bio)
        FROM "authors"
    ) as x(j)
) as x(jsonBio);

ALTER TABLE "authors" ALTER COLUMN "bio2" SET NOT NULL;
ALTER TABLE "authors" DROP COLUMN "bio";
ALTER TABLE "authors" RENAME COLUMN "bio2" TO "bio";

-- Migrate member plans description from jsob[] to jsonb
ALTER TABLE "member.plans" ADD COLUMN "description2" JSONB;

UPDATE "member.plans"
SET description2 = jsonDescription
FROM (
    SELECT jsonb_agg(j::jsonb)
    FROM (
        SELECT unnest(description)
        FROM "member.plans"
    ) as x(j)
) as x(jsonDescription);

ALTER TABLE "member.plans" ALTER COLUMN "description2" SET NOT NULL;
ALTER TABLE "member.plans" DROP COLUMN "description";
ALTER TABLE "member.plans" RENAME COLUMN "description2" TO "description";

-- Migrate peer profiles callToActionText from jsob[] to jsonb
ALTER TABLE "peerProfiles" ADD COLUMN "callToActionText2" JSONB;

UPDATE "peerProfiles"
SET "callToActionText2" = jsonCallToActionText
FROM (
    SELECT jsonb_agg(j::jsonb)
    FROM (
        SELECT unnest("callToActionText")
        FROM "peerProfiles"
    ) as x(j)
) as x(jsonCallToActionText);

ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText2" SET NOT NULL;
ALTER TABLE "peerProfiles" DROP COLUMN "callToActionText";
ALTER TABLE "peerProfiles" RENAME COLUMN "callToActionText2" TO "callToActionText";