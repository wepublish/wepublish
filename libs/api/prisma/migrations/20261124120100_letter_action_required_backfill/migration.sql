-- Letters the print vendor took and then reported an issue for were logged
-- as rejected, like letters that never reached it. They are held there for
-- someone to act on.
UPDATE "mail.log"
SET "state" = 'actionRequired'
WHERE "channel" = 'letter'
  AND "state" = 'rejected'
  AND "providerLetterID" IS NOT NULL
  AND "mailData" LIKE '%webhook_issues%';
