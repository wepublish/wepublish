-- CreateTable
CREATE TABLE "block_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,

    CONSTRAINT "block_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "block_templates_name_key" ON "block_templates"("name");
