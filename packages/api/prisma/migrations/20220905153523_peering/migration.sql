-- CreateTable
CREATE TABLE "articles.peer-information" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "peerId" TEXT NOT NULL,
    "producerArticleId" TEXT NOT NULL,
    "consumerArticleId" TEXT NOT NULL,

    CONSTRAINT "articles.peer-information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles.peer-information_producerArticleId_key" ON "articles.peer-information"("producerArticleId");

-- CreateIndex
CREATE UNIQUE INDEX "articles.peer-information_consumerArticleId_key" ON "articles.peer-information"("consumerArticleId");

-- AddForeignKey
ALTER TABLE "articles.peer-information" ADD CONSTRAINT "articles.peer-information_consumerArticleId_fkey" FOREIGN KEY ("consumerArticleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.peer-information" ADD CONSTRAINT "articles.peer-information_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
