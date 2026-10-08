-- AlterEnum
ALTER TYPE "PaymentProviderType" ADD VALUE 'simulated';

-- AlterTable
ALTER TABLE "settings.paymentprovider" ADD COLUMN     "simulated_declineRenewals" BOOLEAN NOT NULL DEFAULT false;
