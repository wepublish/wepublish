-- CreateTable
CREATE TABLE "seo.checklist_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "completedByUserId" TEXT,

    CONSTRAINT "seo.checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo.checklist_items_itemId_key" ON "seo.checklist_items"("itemId");

-- AddForeignKey
ALTER TABLE "seo.checklist_items" ADD CONSTRAINT "seo.checklist_items_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

