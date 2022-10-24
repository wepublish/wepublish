-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "origin" TEXT;
