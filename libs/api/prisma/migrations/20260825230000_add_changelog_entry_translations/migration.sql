-- CreateTable
CREATE TABLE "changelog.entries.translations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "description" TEXT,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "changelog.entries.translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "changelog.entries.translations_entryId_locale_key" ON "changelog.entries.translations"("entryId", "locale");

-- AddForeignKey
ALTER TABLE "changelog.entries.translations" ADD CONSTRAINT "changelog.entries.translations_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "changelog.entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
