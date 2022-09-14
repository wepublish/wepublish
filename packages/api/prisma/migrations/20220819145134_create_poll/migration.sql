-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "question" TEXT,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls.answers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "answer" TEXT,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "polls.answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls.votes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "answerId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "fingerprint" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "polls.votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls.external-vote-sources" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "pollId" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "polls.external-vote-sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls.external-votes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "answerId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "polls.external-votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "polls.votes_pollId_userId_key" ON "polls.votes"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "polls.external-votes_answerId_sourceId_key" ON "polls.external-votes"("answerId", "sourceId");

-- AddForeignKey
ALTER TABLE "polls.answers" ADD CONSTRAINT "polls.answers_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.votes" ADD CONSTRAINT "polls.votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.votes" ADD CONSTRAINT "polls.votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.votes" ADD CONSTRAINT "polls.votes_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "polls.answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.external-vote-sources" ADD CONSTRAINT "polls.external-vote-sources_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.external-votes" ADD CONSTRAINT "polls.external-votes_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "polls.answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls.external-votes" ADD CONSTRAINT "polls.external-votes_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "polls.external-vote-sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
