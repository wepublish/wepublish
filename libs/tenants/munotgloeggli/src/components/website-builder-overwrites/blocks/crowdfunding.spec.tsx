import { screen } from '@testing-library/react';
import {
  mockCrowdfunding,
  mockCrowdfundingBlock,
  mockCrowdfundingGoal,
  renderWithProviders,
} from '@wepublish/mocks/website';

import { MunotgloeggliCrowdfundingBlock } from './crowdfunding';

describe('MunotgloeggliCrowdfundingBlock', () => {
  it('shows the goal description below the progress instead of in a tooltip', () => {
    renderWithProviders(
      <MunotgloeggliCrowdfundingBlock
        {...mockCrowdfundingBlock({
          crowdfunding: mockCrowdfunding({
            activeGoal: mockCrowdfundingGoal({
              title: 'Neue Glocke',
              description: 'Damit das Glöggli weiter läutet',
            }),
          }),
        })}
      />
    );

    expect(screen.getByText('Neue Glocke')).toBeInTheDocument();
    expect(screen.getByText('Damit das Glöggli weiter läutet')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing without a crowdfunding', () => {
    const { container } = renderWithProviders(
      <MunotgloeggliCrowdfundingBlock
        {...mockCrowdfundingBlock({ crowdfunding: null })}
      />
    );

    expect(container).toHaveTextContent('');
  });
});
