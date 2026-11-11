import { mockMemberPlan, mockPeriodicityPrice } from '@wepublish/mocks/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { act, renderHook } from '@testing-library/react';
import {
  switchedMonthlyAmount,
  useSwitchToYearlyRequest,
} from './switch-periodicity';

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

describe('useSwitchToYearlyRequest', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('is asked for by ?switchTo=yearly', () => {
    window.history.replaceState(
      null,
      '',
      '/profile/subscription/1?switchTo=yearly&utm_source=mail'
    );

    const { result } = renderHook(() => useSwitchToYearlyRequest());

    expect(result.current.requested).toBe(true);
  });

  it('drops the parameter from the url once cleared', () => {
    window.history.replaceState(
      null,
      '',
      '/profile/subscription/1?switchTo=yearly&utm_source=mail'
    );

    const { result } = renderHook(() => useSwitchToYearlyRequest());
    act(() => result.current.clear());

    expect(window.location.pathname + window.location.search).toBe(
      '/profile/subscription/1?utm_source=mail'
    );
  });

  it('is not asked for without it', () => {
    window.history.replaceState(null, '', '/profile/subscription/1');

    const { result } = renderHook(() => useSwitchToYearlyRequest());

    expect(result.current.requested).toBe(false);
  });
});
