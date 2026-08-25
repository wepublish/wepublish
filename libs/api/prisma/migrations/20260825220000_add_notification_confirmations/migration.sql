-- CreateTable
CREATE TABLE "notifications.confirmations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "source" "NotificationSource" NOT NULL,
    "itemId" TEXT NOT NULL,
    "confirmedByUserId" TEXT,

    CONSTRAINT "notifications.confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications.confirmations_source_itemId_key" ON "notifications.confirmations"("source", "itemId");

-- AddForeignKey
ALTER TABLE "notifications.confirmations" ADD CONSTRAINT "notifications.confirmations_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
