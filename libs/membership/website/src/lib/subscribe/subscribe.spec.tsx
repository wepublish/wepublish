import { act, render } from '@testing-library/react';
import * as stories from './subscribe.stories';
import { composeStories } from '@storybook/react';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { getExactPeriodAmountForSelectedPlan } from './subscribe';

const storiesCmp = composeStories(stories);

describe('Subscribe', () => {
  describe('getExactPeriodAmountForSelectedPlan', () => {
    it('uses the exact yearly amount for the default selected amount', () => {
      expect(
        getExactPeriodAmountForSelectedPlan({
          paymentPeriodicity: PaymentPeriodicity.Yearly,
          monthlyAmount: 1667,
          amountPerMonthMin: 1500,
          amountPerMonthTarget: 1667,
          yearlyAmount: 20000,
        })
      ).toBe(20000);
    });

    it('does not use the exact yearly amount for custom selected amounts', () => {
      expect(
        getExactPeriodAmountForSelectedPlan({
          paymentPeriodicity: PaymentPeriodicity.Yearly,
          monthlyAmount: 2000,
          amountPerMonthMin: 1500,
          amountPerMonthTarget: 1667,
          yearlyAmount: 20000,
        })
      ).toBeUndefined();
    });

    it('does not use the exact yearly amount for monthly payments', () => {
      expect(
        getExactPeriodAmountForSelectedPlan({
          paymentPeriodicity: PaymentPeriodicity.Monthly,
          monthlyAmount: 1667,
          amountPerMonthMin: 1500,
          amountPerMonthTarget: 1667,
          yearlyAmount: 20000,
        })
      ).toBeUndefined();
    });
  });

  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    }, 30000);
  });
});
