/*
  Warnings:

  - You are about to drop the column `searchPlainText` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `searchPlainText` on the `pages.revisions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles.revisions" DROP COLUMN "searchPlainText";

-- AlterTable
ALTER TABLE "pages.revisions" DROP COLUMN "searchPlainText";
