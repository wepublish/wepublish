-- CreateTable
CREATE TABLE "user_delivery_bulk_changes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "MailChannel" NOT NULL,
    "audience" JSONB NOT NULL,
    "userCount" INTEGER NOT NULL,
    "changed" INTEGER NOT NULL,
    "skippedWithoutAddress" INTEGER NOT NULL,
    "changedByUserId" TEXT,

    CONSTRAINT "user_delivery_bulk_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_delivery_bulk_changes_createdAt_idx" ON "user_delivery_bulk_changes"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "user_delivery_bulk_changes" ADD CONSTRAINT "user_delivery_bulk_changes_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
