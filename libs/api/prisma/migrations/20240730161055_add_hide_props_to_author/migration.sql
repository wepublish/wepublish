-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "hideOnArticle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideOnTeam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideOnTeaser" BOOLEAN NOT NULL DEFAULT false;
