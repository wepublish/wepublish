-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "mailchimpCampaignId" TEXT,
    "mailchimpCampaignWebId" INTEGER,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);
