import { screen } from '@testing-library/react';
import {
  mockCrowdfunding,
  mockCrowdfundingGoal,
  renderWithProviders,
} from '@wepublish/mocks/website';
import type { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { CrowdfundingRender } from './crowdfunding.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderCrowdfunding = (props: BuilderCrowdfundingBlockProps) =>
  renderWithProviders(
    <CrowdfundingRender
      id="Crowdfunding-1"
      props={props}
      data={emptyPuckBlockData}
      slots={{}}
      className="styled"
    />
  );

describe('CrowdfundingRender', () => {
  it('renders nothing while it has no crowdfunding', () => {
    const { container } = renderCrowdfunding({});

    expect(container.childElementCount).toBe(0);
  });

  it('shows the active goal of the crowdfunding of its props', () => {
    const { container } = renderCrowdfunding({
      crowdfunding: mockCrowdfunding({
        activeGoal: mockCrowdfundingGoal({ title: 'New office' }),
      }),
    });

    expect(container.childElementCount).toBe(1);
    expect(screen.getByText('New office')).toBeTruthy();
  });
});
