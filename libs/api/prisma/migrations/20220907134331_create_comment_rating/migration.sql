-- CreateEnum
CREATE TYPE "RatingSystemType" AS ENUM ('star');

-- CreateTable
CREATE TABLE "comments.rating-systems" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,

    CONSTRAINT "comments.rating-systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments.rating-system-answers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "RatingSystemType" NOT NULL,
    "answer" TEXT,
    "ratingSystemId" TEXT NOT NULL,

    CONSTRAINT "comments.rating-system-answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments.ratings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "answerId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "fingerprint" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comments.ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comments.rating-systems_name_key" ON "comments.rating-systems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "comments.rating-system-answers_ratingSystemId_answer_key" ON "comments.rating-system-answers"("ratingSystemId", "answer");

-- CreateIndex
CREATE UNIQUE INDEX "comments.ratings_answerId_commentId_userId_key" ON "comments.ratings"("answerId", "commentId", "userId");

-- AddForeignKey
ALTER TABLE "comments.rating-system-answers" ADD CONSTRAINT "comments.rating-system-answers_ratingSystemId_fkey" FOREIGN KEY ("ratingSystemId") REFERENCES "comments.rating-systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.ratings" ADD CONSTRAINT "comments.ratings_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.ratings" ADD CONSTRAINT "comments.ratings_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "comments.rating-system-answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.ratings" ADD CONSTRAINT "comments.ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InitData
INSERT INTO "comments.rating-systems" ("id", "modifiedAt", "name") VALUES ('default', CURRENT_TIMESTAMP, 'Default');