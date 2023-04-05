/*
  Warnings:

  - You are about to drop the column `sentReminderAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `invoices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_userID_fkey";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "sentReminderAt",
DROP COLUMN "userID";
