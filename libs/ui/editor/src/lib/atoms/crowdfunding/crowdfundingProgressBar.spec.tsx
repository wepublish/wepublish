import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import {
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';

import { CrowdfundingProgressBar } from './crowdfundingProgressBar';

describe('CrowdfundingProgressBar', () => {
  it('rounds the progress percentage to a whole number', () => {
    render(
      <CrowdfundingProgressBar
        crowdfunding={
          {
            goalType: CrowdfundingGoalType.Subscription,
            subscriptions: 5,
            activeGoal: {
              progress: 100 / 6, // 16.6666...
            },
          } as Partial<FullCrowdfundingFragment>
        }
      />
    );

    expect(screen.getByText('17%')).toBeInTheDocument();
    expect(screen.queryByText(/16\.6/)).not.toBeInTheDocument();
  });

  it('names the progress bar after the figure above it', () => {
    render(
      <CrowdfundingProgressBar
        crowdfunding={
          {
            goalType: CrowdfundingGoalType.Subscription,
            subscriptions: 5,
            activeGoal: { progress: 42 },
          } as Partial<FullCrowdfundingFragment>
        }
      />
    );

    const bar = screen.getByRole('progressbar', {
      name: 'crowdfunding.form.subscriptions',
    });

    expect(bar).toHaveAttribute('aria-valuetext', '42%');
  });

  it('keeps the figure out of the page outline', () => {
    render(
      <CrowdfundingProgressBar
        crowdfunding={
          {
            goalType: CrowdfundingGoalType.Subscription,
            subscriptions: 5,
            activeGoal: { progress: 42 },
          } as Partial<FullCrowdfundingFragment>
        }
      />
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(
      screen.getByText('crowdfunding.form.subscriptions')
    ).toBeInTheDocument();
  });
});
