-- AlterTable
ALTER TABLE "goodies" ADD COLUMN     "paymentPeriodicities" "PaymentPeriodicity"[] DEFAULT ARRAY[]::"PaymentPeriodicity"[];
