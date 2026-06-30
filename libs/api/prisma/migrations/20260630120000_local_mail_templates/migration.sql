-- DropIndex
DROP INDEX "mail_templates_externalMailTemplateId_key";

-- AlterTable
ALTER TABLE "mail_templates" DROP COLUMN "externalMailTemplateId",
DROP COLUMN "remoteMissing",
ADD COLUMN "subject" TEXT NOT NULL DEFAULT '',
ADD COLUMN "htmlContent" TEXT NOT NULL DEFAULT '',
ADD COLUMN "textContent" TEXT;
