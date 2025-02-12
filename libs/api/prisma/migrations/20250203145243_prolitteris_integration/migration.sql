-- CreateEnum
CREATE TYPE "TrackingPixelProviderType" AS ENUM ('prolitteris');

-- CreateTable
CREATE TABLE "articles.tracking-pixels" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "tackingPixelMethodID" TEXT NOT NULL,
    "uri" TEXT,
    "pixelUid" TEXT,
    "error" TEXT,

    CONSTRAINT "articles.tracking-pixels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking.pixels.methods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "trackingPixelProviderID" TEXT NOT NULL,
    "trackingPixelProviderType" "TrackingPixelProviderType" NOT NULL,

    CONSTRAINT "tracking.pixels.methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles.tracking-pixels_uri_key" ON "articles.tracking-pixels"("uri");

-- CreateIndex
CREATE UNIQUE INDEX "articles.tracking-pixels_pixelUid_key" ON "articles.tracking-pixels"("pixelUid");

-- CreateIndex
CREATE UNIQUE INDEX "tracking.pixels.methods_trackingPixelProviderID_key" ON "tracking.pixels.methods"("trackingPixelProviderID");

-- AddForeignKey
ALTER TABLE "articles.tracking-pixels" ADD CONSTRAINT "articles.tracking-pixels_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.tracking-pixels" ADD CONSTRAINT "articles.tracking-pixels_tackingPixelMethodID_fkey" FOREIGN KEY ("tackingPixelMethodID") REFERENCES "tracking.pixels.methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
