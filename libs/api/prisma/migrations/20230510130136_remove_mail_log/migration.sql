/*
  Warnings:

  - You are about to drop the `mail.log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mail.log" DROP CONSTRAINT "mail.log_mailTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "mail.log" DROP CONSTRAINT "mail.log_recipientID_fkey";

-- DropTable
DROP TABLE "mail.log";
