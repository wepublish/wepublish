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

-- CreateIndex
CREATE UNIQUE INDEX "changelog.entries_name_key" ON "changelog.entries"("name");

-- AddForeignKey
ALTER TABLE "changelog.entries" ADD CONSTRAINT "changelog.entries_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
