-- CreateTable
CREATE TABLE "audios" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "filename" TEXT,
    "title" TEXT,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "source" TEXT,
    "link" TEXT,
    "license" TEXT,
    "duration" DOUBLE PRECISION,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audios_createdAt_idx" ON "audios"("createdAt");

-- CreateIndex
CREATE INDEX "audios_modifiedAt_idx" ON "audios"("modifiedAt");

-- CreateIndex
CREATE INDEX "audios_title_idx" ON "audios"("title");

