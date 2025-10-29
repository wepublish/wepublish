import { PaymentPeriodicity } from '@prisma/client';
import { mapPaymentPeriodToMonths } from './payment-period-to-months';

describe('mapPaymentPeriodToMonths', () => {
  it.each([
    PaymentPeriodicity.monthly,
    PaymentPeriodicity.quarterly,
    PaymentPeriodicity.biannual,
    PaymentPeriodicity.yearly,
    PaymentPeriodicity.biennial,
    PaymentPeriodicity.lifetime,
  ])('should format payment period for %s', periodicity => {
    expect(mapPaymentPeriodToMonths(periodicity)).toMatchSnapshot();
  });

  it('should error if if periodicity is not found', () => {
    expect(() => mapPaymentPeriodToMonths('invalid' as any)).toThrowError();
  });
});
