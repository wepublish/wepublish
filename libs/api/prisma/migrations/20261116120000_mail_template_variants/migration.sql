-- CreateTable
CREATE TABLE "mail_templates.variants" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "templateId" TEXT NOT NULL,
    "channel" "MailChannel" NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "htmlContent" TEXT NOT NULL DEFAULT '',
    "textContent" TEXT,
    "letterLayoutId" TEXT,
    "letterAppendixId" TEXT,

    CONSTRAINT "mail_templates.variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_templates.variants_templateId_channel_key" ON "mail_templates.variants"("templateId", "channel");

-- AddForeignKey
ALTER TABLE "mail_templates.variants" ADD CONSTRAINT "mail_templates.variants_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "mail_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_templates.variants" ADD CONSTRAINT "mail_templates.variants_letterLayoutId_fkey" FOREIGN KEY ("letterLayoutId") REFERENCES "letter_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_templates.variants" ADD CONSTRAINT "mail_templates.variants_letterAppendixId_fkey" FOREIGN KEY ("letterAppendixId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Every existing template was written as an email: its content becomes the
-- mail variant.
INSERT INTO "mail_templates.variants"
    ("modifiedAt", "templateId", "channel", "subject", "htmlContent", "textContent")
SELECT "modifiedAt", "id", 'mail', "subject", "htmlContent", "textContent"
FROM "mail_templates";

-- A template that goes out on paper today keeps printing the same words: it
-- gets a letter variant with a copy of them. "On paper" means an automated
-- event switched to letters, a manual letter send, or stationery or an
-- appendix chosen for it.
INSERT INTO "mail_templates.variants"
    ("modifiedAt", "templateId", "channel", "subject", "htmlContent", "letterLayoutId", "letterAppendixId")
SELECT t."modifiedAt", t."id", 'letter', t."subject", t."htmlContent", t."letterLayoutId", t."letterAppendixId"
FROM "mail_templates" t
WHERE t."letterLayoutId" IS NOT NULL
   OR t."letterAppendixId" IS NOT NULL
   OR EXISTS (
        SELECT 1 FROM "subscriptions.intervals" i
        WHERE i."mailTemplateId" = t."id" AND i."sendAsLetter"
      )
   OR EXISTS (
        SELECT 1 FROM "mail.send_jobs" j
        WHERE j."mailTemplateId" = t."id" AND j."channel" = 'letter'
      );
