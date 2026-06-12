import { render, screen } from '@testing-library/react';
import * as stories from './payment-amount.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('PaymentAmount', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('uses picker presets when configured as picker', () => {
    const { AsPicker } = storiesCmp;

    render(<AsPicker />);

    const values = screen
      .getAllByRole('radio', { hidden: true })
      .map(radio => radio.getAttribute('value'))
      .filter((value): value is string => value !== null && value !== '0');

    expect(values).toEqual(['1000', '2000', '3000']);
  });

  it('defaults to the slider layout', () => {
    const { DefaultsToSlider } = storiesCmp;

    render(<DefaultsToSlider />);

    expect(screen.getByRole('slider')).toBeTruthy();
  });
});
