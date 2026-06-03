import { PaymentPeriodicity } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type PeriodAmountConfig = {
      periodicity: PaymentPeriodicity;
      min: number;
      max: number | null;
      target: number | null;
    }[];
  }
}
