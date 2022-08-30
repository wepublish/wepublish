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

-- AddForeignKey
ALTER TABLE "ArticlePeerInformation" ADD CONSTRAINT "ArticlePeerInformation_consumerArticleId_fkey" FOREIGN KEY ("consumerArticleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticlePeerInformation" ADD CONSTRAINT "ArticlePeerInformation_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "peers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
