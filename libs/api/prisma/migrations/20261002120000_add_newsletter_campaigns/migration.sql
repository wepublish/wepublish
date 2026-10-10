-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "mailchimpCampaignId" TEXT,
    "mailchimpCampaignWebId" INTEGER,

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletter_campaigns_modifiedAt_idx" ON "newsletter_campaigns"("modifiedAt" DESC);

