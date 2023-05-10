-- CreateTable
CREATE TABLE "mail.log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "recipientID" TEXT NOT NULL,
    "state" "MailLogState" NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL,
    "mailProviderID" TEXT NOT NULL,
    "mailIdentifier" TEXT NOT NULL,
    "mailTemplateId" UUID NOT NULL,
    "mailData" TEXT,
    "subject" TEXT,

    CONSTRAINT "mail.log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail.log_mailIdentifier_key" ON "mail.log"("mailIdentifier");

-- CreateIndex
CREATE INDEX "mail.log_mailIdentifier_idx" ON "mail.log"("mailIdentifier");

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
