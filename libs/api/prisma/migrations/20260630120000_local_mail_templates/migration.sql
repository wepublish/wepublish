-- AlterTable
-- externalMailTemplateId is kept (made nullable) so existing remote-template
-- installs can import their HTML/subject from the provider before it's dropped
-- in a later migration. remoteMissing is removed; local content columns added.
ALTER TABLE "mail_templates"
DROP COLUMN "remoteMissing",
ALTER COLUMN "externalMailTemplateId" DROP NOT NULL,
ADD COLUMN "subject" TEXT NOT NULL DEFAULT '',
ADD COLUMN "htmlContent" TEXT NOT NULL DEFAULT '',
ADD COLUMN "textContent" TEXT;
