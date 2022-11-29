-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userImageID" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userImageID_fkey" FOREIGN KEY ("userImageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
