import { mockMemberPlan, mockPeriodicityPrice } from '@wepublish/mocks/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { switchedMonthlyAmount } from './switch-periodicity';

describe('switchedMonthlyAmount', () => {
  const memberPlan = mockMemberPlan({
    periodicityPricing: [
      mockPeriodicityPrice({
        periodicity: PaymentPeriodicity.Monthly,
        amountMin: 1000,
      }),
    ],
  });

  it('keeps the amount the reader pays', () => {
    expect(
      switchedMonthlyAmount(
        { memberPlan, monthlyAmount: 1500 },
        PaymentPeriodicity.Yearly
      )
    ).toBe(1500);
  });

  it('raises it to the minimum of the new periodicity', () => {
    expect(
      switchedMonthlyAmount(
        {
          memberPlan: mockMemberPlan({
            periodicityPricing: [
              mockPeriodicityPrice({
                periodicity: PaymentPeriodicity.Monthly,
                amountMin: 1000,
              }),
              mockPeriodicityPrice({
                periodicity: PaymentPeriodicity.Yearly,
                amountMin: 15000,
              }),
            ],
          }),
          monthlyAmount: 1000,
        },
        PaymentPeriodicity.Yearly
      )
    ).toBe(1250);
  });
});
