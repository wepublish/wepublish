-- AlterEnum
ALTER TYPE "TagType" ADD VALUE 'author';

-- DropForeignKey
ALTER TABLE "user_communication_flows" DROP CONSTRAINT "user_communication_flows_mailTemplateId_fkey";

-- CreateTable
CREATE TABLE "authors.tagged-authors" (
    "authorId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authors.tagged-authors_pkey" PRIMARY KEY ("authorId","tagId")
);

-- AddForeignKey
ALTER TABLE "authors.tagged-authors" ADD CONSTRAINT "authors.tagged-authors_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors.tagged-authors" ADD CONSTRAINT "authors.tagged-authors_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_communication_flows" ADD CONSTRAINT "user_communication_flows_mailTemplateId_fkey" FOREIGN KEY ("mailTemplateId") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
