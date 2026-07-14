-- CreateTable
CREATE TABLE "goodies" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB,
    "stock" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "imageID" TEXT,

    CONSTRAINT "goodies_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "goodieID" TEXT;

-- CreateTable
CREATE TABLE "_GoodieToMemberPlan" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GoodieToMemberPlan_AB_unique" ON "_GoodieToMemberPlan"("A", "B");

-- CreateIndex
CREATE INDEX "_GoodieToMemberPlan_B_index" ON "_GoodieToMemberPlan"("B");

-- AddForeignKey
ALTER TABLE "goodies" ADD CONSTRAINT "goodies_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_goodieID_fkey" FOREIGN KEY ("goodieID") REFERENCES "goodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoodieToMemberPlan" ADD CONSTRAINT "_GoodieToMemberPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "goodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoodieToMemberPlan" ADD CONSTRAINT "_GoodieToMemberPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
