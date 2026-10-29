-- CreateTable
CREATE TABLE "article_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "blockTemplateId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "article_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_templates_blockTemplateId_key" ON "article_templates"("blockTemplateId");

-- AddForeignKey
ALTER TABLE "article_templates" ADD CONSTRAINT "article_templates_blockTemplateId_fkey" FOREIGN KEY ("blockTemplateId") REFERENCES "block_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

