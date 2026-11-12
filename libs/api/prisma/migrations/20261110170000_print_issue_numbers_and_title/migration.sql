-- double issues («3/4.26»: numbers 3 to 4, counting as 2) and a topic per issue
-- AlterTable
ALTER TABLE "print.issues" ADD COLUMN     "countsAs" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "numberTo" INTEGER,
ADD COLUMN     "title" TEXT;
