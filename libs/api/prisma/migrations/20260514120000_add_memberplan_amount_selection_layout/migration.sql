-- CreateEnum
CREATE TYPE "AmountSelectionLayout" AS ENUM ('Slider', 'Picker');

-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "amountSelectionLayout" "AmountSelectionLayout" NOT NULL DEFAULT 'Slider',
ADD COLUMN     "presetAmounts" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
