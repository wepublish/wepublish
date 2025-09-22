-- DropIndex
DROP INDEX "comments.rating-override_answerId_commentId_key";

-- AlterTable
ALTER TABLE "comments.rating-override" ADD CONSTRAINT "comments.rating-override_pkey" PRIMARY KEY ("answerId", "commentId");
