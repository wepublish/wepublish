-- CreateIndex
CREATE INDEX "comments_itemID_itemType_idx" ON "comments"("itemID", "itemType");

-- CreateIndex
CREATE INDEX "comments_parentID_idx" ON "comments"("parentID");
