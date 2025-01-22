-- CreateEnum
CREATE TYPE "TrackingPixelProviderType" AS ENUM ('prolitteris');

-- CreateTable
CREATE TABLE "articles.tracking-pixels " (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "trackingPixelProviderID" TEXT NOT NULL,
    "trackingPixelProviderType" "TrackingPixelProviderType" NOT NULL,
    "uri" TEXT,
    "error" TEXT,

    CONSTRAINT "articles.tracking-pixels _pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles.tracking-pixels _uri_key" ON "articles.tracking-pixels "("uri");

-- AddForeignKey
ALTER TABLE "articles.tracking-pixels " ADD CONSTRAINT "articles.tracking-pixels _articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
