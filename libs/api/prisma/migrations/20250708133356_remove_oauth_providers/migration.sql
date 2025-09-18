/*
  Warnings:

  - You are about to drop the `users.oauth2-accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users.oauth2-accounts" DROP CONSTRAINT "users.oauth2-accounts_userId_fkey";

-- DropTable
DROP TABLE "users.oauth2-accounts";
