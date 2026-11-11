import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatCurrency } from '@wepublish/membership/website';
import {
  mockCrowdfunding,
  mockCrowdfundingBlock,
  mockCrowdfundingGoal,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { CrowdfundingGoalType, Currency } from '@wepublish/website/api';
import { t } from 'i18next';
import { CrowdfundingBlock } from './crowdfunding-block';

const plain = (text: string) => text.replace(/<[^>]+>/g, '');

describe('CrowdfundingBlock', () => {
  it('shows the revenue raised towards the active goal', () => {
    const { container } = renderWithProviders(
      <CrowdfundingBlock
        {...mockCrowdfundingBlock({
          crowdfunding: mockCrowdfunding({
            goalType: CrowdfundingGoalType.Revenue,
            revenue: 7300000,
            activeGoal: mockCrowdfundingGoal({
              title: 'New office',
              amount: 10000000,
              progress: 73,
            }),
          }),
        })}
      />
    );

    expect(container).toHaveTextContent(
      plain(
        t('crowdfunding.goal', {
          type: CrowdfundingGoalType.Revenue,
          revenue: formatCurrency(73000, Currency.Chf),
          subscriptions: 120,
        })
      )
    );
    expect(
      screen.getByText(formatCurrency(100000, Currency.Chf))
    ).toBeInTheDocument();
    expect(screen.getByText('New office')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '73'
    );
  });

  it('counts subscriptions towards a subscription goal', () => {
    const { container } = renderWithProviders(
      <CrowdfundingBlock
        {...mockCrowdfundingBlock({
          crowdfunding: mockCrowdfunding({
            goalType: CrowdfundingGoalType.Subscription,
            subscriptions: 120,
            activeGoal: mockCrowdfundingGoal({ amount: 5000 }),
          }),
        })}
      />
    );

    expect(container).toHaveTextContent(
      plain(
        t('crowdfunding.goal', {
          type: CrowdfundingGoalType.Subscription,
          subscriptions: 120,
        })
      )
    );
    expect(screen.getByText("5'000")).toBeInTheDocument();
  });

  it('explains the goal in a tooltip', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CrowdfundingBlock
        {...mockCrowdfundingBlock({
          crowdfunding: mockCrowdfunding({
            activeGoal: mockCrowdfundingGoal({
              description: 'We need a bigger newsroom',
            }),
          }),
        })}
      />
    );

    await user.hover(
      screen.getByRole('button', { name: 'We need a bigger newsroom' })
    );

    expect(
      await screen.findByRole('tooltip', { name: 'We need a bigger newsroom' })
    ).toBeInTheDocument();
  });

  it('shows no info button when the goal has no description', () => {
    renderWithProviders(
      <CrowdfundingBlock
        {...mockCrowdfundingBlock({
          crowdfunding: mockCrowdfunding({
            activeGoal: mockCrowdfundingGoal({ description: null }),
          }),
        })}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing without a crowdfunding', () => {
    const { container } = renderWithProviders(
      <CrowdfundingBlock {...mockCrowdfundingBlock({ crowdfunding: null })} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
