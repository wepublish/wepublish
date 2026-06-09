import '@testing-library/jest-dom';
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
});
