-- AlterTable
ALTER TABLE "authors" RENAME COLUMN "bio" to "slateBio";
ALTER TABLE "authors" ADD COLUMN    "bio" JSONB;

-- AlterTable
ALTER TABLE "comments.revisions" RENAME COLUMN "text" to "slateText";
ALTER TABLE "comments.revisions" ADD COLUMN     "text" JSONB;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "slateDescription" JSONB;
UPDATE      "events" SET "slateDescription" = to_jsonb("description");
ALTER TABLE "events" DROP COLUMN "description";
ALTER TABLE "events" ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "peerProfiles" RENAME COLUMN "callToActionText" to "slateCallToActionText";
ALTER TABLE "peerProfiles" ADD COLUMN     "callToActionText" JSONB;

-- AlterTable
ALTER TABLE "peers" RENAME COLUMN "information" to "slateInformation";
ALTER TABLE "peers" ADD COLUMN     "information" JSONB;

-- AlterTable
ALTER TABLE "polls" RENAME COLUMN "infoText" to "slateInfoText";
ALTER TABLE "polls" ADD COLUMN     "infoText" JSONB;

-- AlterTable
ALTER TABLE "tags" RENAME COLUMN "description" to "slateDescription";
ALTER TABLE "tags" ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "member.plans" RENAME COLUMN "description" to "slateDescription";
ALTER TABLE "member.plans" ADD COLUMN     "description" JSONB;

ALTER TABLE "member.plans" RENAME COLUMN "shortDescription" to "slateShortDescription";
ALTER TABLE "member.plans" ADD COLUMN     "shortDescription" JSONB;

-- AlterTable
ALTER TABLE "paywalls" RENAME COLUMN "circumventDescription" to "slateCircumventDescription";
ALTER TABLE "paywalls" ADD COLUMN     "circumventDescription" JSONB;

ALTER TABLE "paywalls" RENAME COLUMN "description" to "slateDescription";
ALTER TABLE "paywalls" ADD COLUMN     "description" JSONB;


--AlterTable
UPDATE "articles.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText":',
    '"richText": null, "slateRichText":'
)::jsonb
WHERE blocks::text LIKE '%"richText":%';

UPDATE "pages.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText":',
    '"richText": null, "slateRichText":'
)::jsonb
WHERE blocks::text LIKE '%"richText":%';