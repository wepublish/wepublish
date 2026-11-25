-- AlterTable
ALTER TABLE "users" ADD COLUMN     "wepublishLoginSubject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_wepublishLoginSubject_key" ON "users"("wepublishLoginSubject");
