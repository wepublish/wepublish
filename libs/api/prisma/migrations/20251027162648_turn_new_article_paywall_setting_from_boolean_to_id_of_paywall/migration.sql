-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "value" DROP NOT NULL,
ALTER COLUMN "settingRestriction" DROP NOT NULL;

UPDATE "settings"
SET "value" = null, "settingRestriction" = null
WHERE "name" = 'newArticlePaywall';