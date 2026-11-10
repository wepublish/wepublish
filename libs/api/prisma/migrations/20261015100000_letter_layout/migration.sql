-- AlterTable
ALTER TABLE "mail_templates" ADD COLUMN     "letterLayoutId" TEXT;

-- CreateTable
CREATE TABLE "letter_layouts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "headerHtml" TEXT NOT NULL DEFAULT '',
    "footerHtml" TEXT NOT NULL DEFAULT '',
    "headerHeightMm" INTEGER NOT NULL DEFAULT 30,
    "footerHeightMm" INTEGER NOT NULL DEFAULT 20,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "letter_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter_layouts_name_key" ON "letter_layouts"("name");

-- AddForeignKey
ALTER TABLE "mail_templates" ADD CONSTRAINT "mail_templates_letterLayoutId_fkey" FOREIGN KEY ("letterLayoutId") REFERENCES "letter_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
