-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "filename" TEXT,
    "title" TEXT,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_createdAt_idx" ON "videos"("createdAt");

-- CreateIndex
CREATE INDEX "videos_modifiedAt_idx" ON "videos"("modifiedAt");

-- CreateIndex
CREATE INDEX "videos_title_idx" ON "videos"("title");

