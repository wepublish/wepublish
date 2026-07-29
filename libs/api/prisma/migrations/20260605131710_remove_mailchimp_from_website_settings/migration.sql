/*
  Warnings:

  - You are about to drop the column `mailMailchimpEnabled` on the `settings.website` table. All the data in the column will be lost.
  - You are about to drop the column `mailMailchimpKey` on the `settings.website` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "settings.website" DROP COLUMN "mailMailchimpEnabled",
DROP COLUMN "mailMailchimpKey";
