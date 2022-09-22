/*
  Warnings:

  - The primary key for the `polls.external-votes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `polls.external-votes` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `polls.external-votes` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedAt` on the `polls.external-votes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "polls.external-votes" DROP CONSTRAINT "polls.external-votes_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "modifiedAt";

-- CreateTable
CREATE TABLE "ArticlePeerInformation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "peerId" TEXT NOT NULL,
    "producerArticleId" TEXT NOT NULL,
    "consumerArticleId" TEXT NOT NULL,

    CONSTRAINT "ArticlePeerInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticlePeerInformation_consumerArticleId_key" ON "ArticlePeerInformation"("consumerArticleId");

-- AddForeignKey
ALTER TABLE "ArticlePeerInformation" ADD CONSTRAINT "ArticlePeerInformation_consumerArticleId_fkey" FOREIGN KEY ("consumerArticleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticlePeerInformation" ADD CONSTRAINT "ArticlePeerInformation_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
