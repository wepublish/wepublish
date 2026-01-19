/*
  Warnings:

  - You are about to drop the column `streetAddress2_original_20251210` on the `users.addresses` table. All the data in the column will be lost.
  - You are about to drop the column `streetAddress_original_20251210` on the `users.addresses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "paywalls" ADD COLUMN     "fadeout" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hideContentAfter" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "users.addresses" DROP COLUMN "streetAddress2_original_20251210",
DROP COLUMN "streetAddress_original_20251210";
