-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- UPDATE IDs on articles table to guid
ALTER TABLE "articles" ADD "oldId" TEXT NULL;
UPDATE "articles" SET "oldId" = "id";

UPDATE "articles" SET "id" = gen_random_uuid();

ALTER TABLE "navigations.links" DROP CONSTRAINT "navigations.links_articleID_fkey";
ALTER TABLE "articles" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
ALTER TABLE "navigations.links" ALTER COLUMN "articleID" TYPE uuid USING "articleID"::uuid;
UPDATE "comments" SET "itemID" = "articles"."id" FROM "articles" WHERE "comments"."itemID" = "articles"."oldId" AND "comments"."itemType" = 'article';

ALTER TABLE "navigations.links" ADD CONSTRAINT "navigations.links_articleID_fkey" FOREIGN KEY ("articleID") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
