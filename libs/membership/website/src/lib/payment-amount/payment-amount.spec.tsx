import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './payment-amount.stories';

const { AsSlider, AsPicker, DefaultsToSlider } = composeStories(stories);

describe('PaymentAmount', () => {
  it('renders the slider when layout is Slider', () => {
    render(<AsSlider />);

    expect(screen.queryByRole('slider')).not.toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('renders the picker when layout is Picker', () => {
    render(<AsPicker />);

    expect(screen.queryByRole('radiogroup')).not.toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('defaults to slider when layout is undefined', () => {
    render(<DefaultsToSlider />);

    expect(screen.queryByRole('slider')).not.toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });
});
