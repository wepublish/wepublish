-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('comment');

-- CreateTable
CREATE TABLE "comments.tagged-comments" (
    "commentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments.tagged-comments_pkey" PRIMARY KEY ("commentId","tagId")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "TagType" NOT NULL,
    "tag" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_type_tag_key" ON "tags"("type", "tag");

-- AddForeignKey
ALTER TABLE "comments.tagged-comments" ADD CONSTRAINT "comments.tagged-comments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.tagged-comments" ADD CONSTRAINT "comments.tagged-comments_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
