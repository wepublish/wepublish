-- CreateTable
CREATE TABLE "Banner" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "showOnArticles" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerAction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "bannerId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "BannerAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BannerToPage" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToPage_AB_unique" ON "_BannerToPage"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToPage_B_index" ON "_BannerToPage"("B");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerAction" ADD CONSTRAINT "BannerAction_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToPage" ADD CONSTRAINT "_BannerToPage_A_fkey" FOREIGN KEY ("A") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToPage" ADD CONSTRAINT "_BannerToPage_B_fkey" FOREIGN KEY ("B") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
