-- CreateTable
CREATE TABLE "mail_template_attachments" (
    "mailTemplateId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "mail_template_attachments_pkey" PRIMARY KEY ("mailTemplateId","documentId")
);

-- CreateIndex
CREATE INDEX "mail_template_attachments_documentId_idx" ON "mail_template_attachments"("documentId");

-- AddForeignKey
ALTER TABLE "mail_template_attachments" ADD CONSTRAINT "mail_template_attachments_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_template_attachments" ADD CONSTRAINT "mail_template_attachments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

