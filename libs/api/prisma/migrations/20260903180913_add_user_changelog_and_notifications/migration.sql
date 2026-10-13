-- CreateEnum
CREATE TYPE "NotificationSource" AS ENUM ('CHANGELOG', 'ONE_MESSAGE', 'PERIODIC_JOB');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('de', 'en', 'fr');

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

-- CreateTable
CREATE TABLE "changelog.entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "releasedAt" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "description" TEXT,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMPTZ(3),
    "confirmedByUserId" TEXT,

    CONSTRAINT "changelog.entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog.entries.translations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "description" TEXT,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "changelog.entries.translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications.reads_userId_source_itemId_key" ON "notifications.reads"("userId", "source", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications.confirmations_source_itemId_key" ON "notifications.confirmations"("source", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "changelog.entries_name_key" ON "changelog.entries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "changelog.entries.translations_entryId_locale_key" ON "changelog.entries.translations"("entryId", "locale");

-- AddForeignKey
ALTER TABLE "notifications.reads" ADD CONSTRAINT "notifications.reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications.confirmations" ADD CONSTRAINT "notifications.confirmations_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "changelog.entries" ADD CONSTRAINT "changelog.entries_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "changelog.entries.translations" ADD CONSTRAINT "changelog.entries.translations_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "changelog.entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

