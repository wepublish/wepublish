-- CreateTable
CREATE TABLE "settings.syncprovidernewsletter" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "syncProviderId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "imageID" TEXT,

    CONSTRAINT "settings.syncprovidernewsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings.syncprovidernewsletter_syncProviderId_interestId_key" ON "settings.syncprovidernewsletter"("syncProviderId", "interestId");

-- AddForeignKey
ALTER TABLE "settings.syncprovidernewsletter" ADD CONSTRAINT "settings.syncprovidernewsletter_syncProviderId_fkey" FOREIGN KEY ("syncProviderId") REFERENCES "settings.syncprovider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings.syncprovidernewsletter" ADD CONSTRAINT "settings.syncprovidernewsletter_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
