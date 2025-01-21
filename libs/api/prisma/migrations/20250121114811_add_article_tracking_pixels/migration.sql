-- CreateTable
CREATE TABLE "articles.tracking-pixels " (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "trackingPixelProviderID" TEXT NOT NULL,
    "trackingPixelProviderType" TEXT NOT NULL,
    "uri" TEXT NOT NULL,

    CONSTRAINT "articles.tracking-pixels _pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "articles.tracking-pixels " ADD CONSTRAINT "articles.tracking-pixels _articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
