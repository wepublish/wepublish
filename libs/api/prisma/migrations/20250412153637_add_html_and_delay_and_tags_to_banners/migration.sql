-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "delay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "html" TEXT;

-- CreateTable
CREATE TABLE "_BannerToTag" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToTag_AB_unique" ON "_BannerToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToTag_B_index" ON "_BannerToTag"("B");

-- AddForeignKey
ALTER TABLE "_BannerToTag" ADD CONSTRAINT "_BannerToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToTag" ADD CONSTRAINT "_BannerToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
