-- CreateEnum
CREATE TYPE "NotificationSource" AS ENUM ('CHANGELOG', 'ONE_MESSAGE', 'PERIODIC_JOB');

-- CreateTable
CREATE TABLE "notifications.reads" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "source" "NotificationSource" NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications.reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications.reads_userId_source_itemId_key" ON "notifications.reads"("userId", "source", "itemId");

-- AddForeignKey
ALTER TABLE "notifications.reads" ADD CONSTRAINT "notifications.reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
