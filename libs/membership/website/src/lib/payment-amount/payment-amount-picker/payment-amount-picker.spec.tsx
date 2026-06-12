import { render, screen } from '@testing-library/react';
import * as stories from './payment-amount-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);
const getPresetRadioValues = () =>
  screen
    .getAllByRole('radio', { hidden: true })
    .map(radio => radio.getAttribute('value'))
    .filter((value): value is string => value !== null && value !== '0');

describe('PaymentAmountPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('renders configured presetAmounts as radio options', () => {
    const { WithPresetAmounts } = storiesCmp;

    render(<WithPresetAmounts />);

    expect(getPresetRadioValues()).toEqual(['500', '2500', '5000']);
  });

  it('falls back to default picker amounts when presetAmounts is empty', () => {
    const { EmptyPresetAmountsFallback } = storiesCmp;

    render(<EmptyPresetAmountsFallback />);

    expect(getPresetRadioValues()).toEqual(['1000', '1500', '2000']);
  });
});
