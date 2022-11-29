-- CreateTable
CREATE TABLE "comments.rating-override" (
    "answerId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "value" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "comments.rating-override_answerId_commentId_key" ON "comments.rating-override"("answerId", "commentId");

-- AddForeignKey
ALTER TABLE "comments.rating-override" ADD CONSTRAINT "comments.rating-override_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.rating-override" ADD CONSTRAINT "comments.rating-override_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "comments.rating-system-answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
