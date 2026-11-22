-- CreateTable
CREATE TABLE "mail.audience_filters" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audience" JSONB NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "mail.audience_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail.audience_filters_name_key" ON "mail.audience_filters"("name");

-- AddForeignKey
ALTER TABLE "mail.audience_filters" ADD CONSTRAINT "mail.audience_filters_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
