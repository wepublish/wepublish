import { PaymentPeriodicity } from '@prisma/client';
import { getMemberPlanPeriodAmount, getPeriodAmount } from './member-context';

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

describe('getMemberPlanPeriodAmount', () => {
  it('uses the exact yearly amount for the default selected monthly amount', () => {
    expect(
      getMemberPlanPeriodAmount({
        paymentPeriodicity: PaymentPeriodicity.yearly,
        monthlyAmount: 1667,
        memberPlan: {
          amountPerMonthMin: 1500,
          amountPerMonthTarget: 1667,
          yearlyAmount: 20000,
        },
      })
    ).toBe(20000);
  });

  it('does not override a custom monthly amount with the member plan yearly amount', () => {
    expect(
      getMemberPlanPeriodAmount({
        paymentPeriodicity: PaymentPeriodicity.yearly,
        monthlyAmount: 2000,
        memberPlan: {
          amountPerMonthMin: 1500,
          amountPerMonthTarget: 1667,
          yearlyAmount: 20000,
        },
      })
    ).toBeNull();
  });

  it('falls back to the minimum amount when no target amount is configured', () => {
    expect(
      getMemberPlanPeriodAmount({
        paymentPeriodicity: PaymentPeriodicity.yearly,
        monthlyAmount: 1500,
        memberPlan: {
          amountPerMonthMin: 1500,
          amountPerMonthTarget: null,
          yearlyAmount: 18000,
        },
      })
    ).toBe(18000);
  });

  it('does not set an exact period amount for non-yearly subscriptions', () => {
    expect(
      getMemberPlanPeriodAmount({
        paymentPeriodicity: PaymentPeriodicity.monthly,
        monthlyAmount: 1500,
        memberPlan: {
          amountPerMonthMin: 1500,
          amountPerMonthTarget: null,
          yearlyAmount: 18000,
        },
      })
    ).toBeNull();
  });
});
