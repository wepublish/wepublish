-- AlterTable
ALTER TABLE "authors" DROP COLUMN "bio";
ALTER TABLE "authors" RENAME COLUMN "slateBio" to "bio";

-- AlterTable
ALTER TABLE "comments.revisions" DROP COLUMN "text";
ALTER TABLE "comments.revisions" RENAME COLUMN "slateText" to "text";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "description";
ALTER TABLE "events" ADD COLUMN     "description" JSONB[];
UPDATE      "events" SET "description" = (
    SELECT array_agg("elem")
    FROM jsonb_array_elements("slateDescription") AS "elem"
);
ALTER TABLE "events" DROP COLUMN "slateDescription";

-- AlterTable
ALTER TABLE "peerProfiles" DROP COLUMN "callToActionText";
ALTER TABLE "peerProfiles" RENAME COLUMN "slateCallToActionText" to "callToActionText";
ALTER TABLE "peerProfiles" ALTER COLUMN "callToActionText" SET NOT NULL;

-- AlterTable
ALTER TABLE "peers" DROP COLUMN "information";
ALTER TABLE "peers" RENAME COLUMN "slateInformation" to "information";

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "infoText";
ALTER TABLE "polls" RENAME COLUMN "slateInfoText" to "infoText";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "description";
ALTER TABLE "tags" RENAME COLUMN "slateDescription" to "description";

-- AlterTable
ALTER TABLE "member.plans" DROP COLUMN "description";
ALTER TABLE "member.plans" RENAME COLUMN "slateDescription" to "description";
ALTER TABLE "member.plans" ALTER COLUMN "description" SET NOT NULL;

ALTER TABLE "member.plans" DROP COLUMN "shortDescription";
ALTER TABLE "member.plans" RENAME COLUMN "slateShortDescription" to "shortDescription";

-- AlterTable
ALTER TABLE "paywalls" DROP COLUMN "circumventDescription";
ALTER TABLE "paywalls" RENAME COLUMN "slateCircumventDescription" to "circumventDescription";

ALTER TABLE "paywalls" DROP COLUMN "description";
ALTER TABLE "paywalls" RENAME COLUMN "slateDescription" to "description";

ALTER TABLE "paywalls" DROP COLUMN "upgradeCircumventDescription";
ALTER TABLE "paywalls" RENAME COLUMN "slateUpgradeCircumventDescription" to "upgradeCircumventDescription";

ALTER TABLE "paywalls" DROP COLUMN "upgradeDescription";
ALTER TABLE "paywalls" RENAME COLUMN "slateUpgradeDescription" to "upgradeDescription";


--AlterTable
UPDATE "articles.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText": null, "slateRichText":',
    '"richText":'
)::jsonb
WHERE blocks::text LIKE '%"slateRichText":%';

UPDATE "pages.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText": null, "slateRichText":',
    '"richText":'
)::jsonb
WHERE blocks::text LIKE '%"slateRichText":%';




-- In case the migration run through:
UPDATE "articles.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText":',
    '"richText": null, "pmRichText":'
)::jsonb
WHERE blocks::text LIKE '%"richText":%';

UPDATE "pages.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText":',
    '"richText": null, "pmRichText":'
)::jsonb
WHERE blocks::text LIKE '%"richText":%';

UPDATE "articles.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"slateRichText":',
    '"richText":'
)::jsonb
WHERE blocks::text LIKE '%"slateRichText":%';

UPDATE "pages.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"slateRichText":',
    '"richText":'
)::jsonb
WHERE blocks::text LIKE '%"slateRichText":%';

