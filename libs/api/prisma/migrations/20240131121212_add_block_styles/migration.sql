-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('richText', 'title', 'image', 'imageGallery', 'listicle', 'quote', 'embed', 'linkPageBreak', 'teaserGrid1', 'teaserGrid6', 'teaserGridFlex', 'html', 'poll', 'comment', 'event');

-- CreateTable
CREATE TABLE "block-content.styles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "blocks" "BlockType"[],

    CONSTRAINT "block-content.styles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "block-content.styles_name_key" ON "block-content.styles"("name");
