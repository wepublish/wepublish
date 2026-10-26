-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "hideFooter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideHeader" BOOLEAN NOT NULL DEFAULT false;
