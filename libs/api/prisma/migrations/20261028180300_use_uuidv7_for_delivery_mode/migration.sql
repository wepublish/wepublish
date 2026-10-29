-- AlterTable
ALTER TABLE "user_delivery_suggestions" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "user_delivery_bulk_changes" ALTER COLUMN "id" SET DEFAULT uuidv7();
