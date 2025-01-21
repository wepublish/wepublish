-- AlterTable
ALTER TABLE "member.plans" ADD COLUMN     "amountPerMonthTarget" DOUBLE PRECISION;
ALTER TABLE "member.plans" ADD CONSTRAINT check_target_greater_than_min CHECK ("amountPerMonthTarget" > "amountPerMonthMin");
