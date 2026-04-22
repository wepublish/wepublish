-- CreateTable
CREATE TABLE "mailchimp_sync_errors" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "syncProviderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "statusCode" INTEGER,

    CONSTRAINT "mailchimp_sync_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mailchimp_sync_errors_userId_syncProviderId_key" ON "mailchimp_sync_errors"("userId", "syncProviderId");

-- AddForeignKey
ALTER TABLE "mailchimp_sync_errors" ADD CONSTRAINT "mailchimp_sync_errors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailchimp_sync_errors" ADD CONSTRAINT "mailchimp_sync_errors_syncProviderId_fkey" FOREIGN KEY ("syncProviderId") REFERENCES "settings.syncprovider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
