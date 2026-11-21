-- A letter version can say what the email says instead of keeping a copy.
ALTER TABLE "mail_templates.variants"
  ADD COLUMN "sameAsMail" BOOLEAN NOT NULL DEFAULT false;

-- The letter versions created as copies of their email, and still identical
-- to it, become "same as the email": one text to maintain instead of two.
UPDATE "mail_templates.variants" AS letter
SET "sameAsMail" = true,
    "subject" = '',
    "htmlContent" = ''
FROM "mail_templates.variants" AS mail
WHERE letter."channel" = 'letter'
  AND mail."channel" = 'mail'
  AND mail."templateId" = letter."templateId"
  AND mail."subject" = letter."subject"
  AND mail."htmlContent" = letter."htmlContent";
