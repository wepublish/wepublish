-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "guestUserImageID" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "comments.revisions" ADD COLUMN     "lead" TEXT,
ADD COLUMN     "title" TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_guestUserImageID_fkey" FOREIGN KEY ("guestUserImageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
