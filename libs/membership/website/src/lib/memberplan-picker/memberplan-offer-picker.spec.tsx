import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
} from '@wepublish/storybook/mocks';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import * as stories from './memberplan-offer-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('MemberPlanOfferPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('should render the offer card content, not just the radio buttons', () => {
    render(<storiesCmp.Default />);

    expect(screen.getByText('2 Monate geschenkt')).toBeVisible();
    expect(screen.getByText('Monatlich')).toBeVisible();
    expect(screen.getByText('Jährlich')).toBeVisible();
  });

  it('shows the description of the selected plan below the offers', async () => {
    const richText = (text: string) => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    const yearly = [
      mockAvailablePaymentMethod({
        paymentPeriodicities: [PaymentPeriodicity.Yearly],
      }),
    ];
    const memberPlans = [
      mockMemberPlan({
        name: 'Jahresabo',
        image: null,
        description: richText('Vier Ausgaben pro Jahr'),
        availablePaymentMethods: yearly,
      }),
      mockMemberPlan({
        name: 'Lebenszeit-Abo',
        image: null,
        description: richText('Ein Leben lang'),
        availablePaymentMethods: [
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Lifetime],
          }),
        ],
      }),
    ] as FullMemberPlanFragment[];

    render(<storiesCmp.Default memberPlans={memberPlans} />);

    expect(
      await screen.findByText('Vier Ausgaben pro Jahr')
    ).toBeInTheDocument();
    expect(screen.queryByText('Ein Leben lang')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('radio')[1]);

    expect(await screen.findByText('Ein Leben lang')).toBeInTheDocument();
    expect(
      screen.queryByText('Vier Ausgaben pro Jahr')
    ).not.toBeInTheDocument();
  });
});
