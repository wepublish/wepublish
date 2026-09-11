import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
});
