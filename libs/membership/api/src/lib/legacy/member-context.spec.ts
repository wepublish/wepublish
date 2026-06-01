import { PaymentPeriodicity } from '@prisma/client';
import { getPeriodAmount } from './member-context';

describe('getPeriodAmount', () => {
  it('returns periodAmount when set', () => {
    expect(
      getPeriodAmount({
        periodAmount: 23000,
        monthlyAmount: 1917,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      })
    ).toBe(23000);
  });

  it('falls back to monthlyAmount × months when periodAmount is null', () => {
    expect(
      getPeriodAmount({
        periodAmount: null,
        monthlyAmount: 1000,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      })
    ).toBe(12000);
  });

  it('falls back when periodAmount is undefined', () => {
    expect(
      getPeriodAmount({
        monthlyAmount: 500,
        paymentPeriodicity: PaymentPeriodicity.monthly,
      })
    ).toBe(500);
  });

  it('prefers periodAmount even when it differs from monthlyAmount × months', () => {
    expect(
      getPeriodAmount({
        periodAmount: 20000,
        monthlyAmount: 1667,
        paymentPeriodicity: PaymentPeriodicity.yearly,
      })
    ).toBe(20000);
  });
});
