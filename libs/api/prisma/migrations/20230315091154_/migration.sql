/*
  Warnings:

  - A unique constraint covering the columns `[userId,consentId]` on the table `user-consents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user-consents_userId_consentId_key" ON "user-consents"("userId", "consentId");
