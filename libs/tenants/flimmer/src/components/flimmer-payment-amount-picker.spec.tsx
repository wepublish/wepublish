import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { Currency } from '@wepublish/website/api';
import { ComponentProps } from 'react';

import { FlimmerPaymentAmountPicker } from './flimmer-payment-amount-picker';

const renderPicker = (
  props: Partial<ComponentProps<typeof FlimmerPaymentAmountPicker>> = {}
) =>
  renderWithProviders(
    <FlimmerPaymentAmountPicker
      amountPerMonthMin={500}
      amountPerMonthTarget={undefined}
      currency={Currency.Chf}
      value={1500}
      donate={false}
      error={undefined}
      onChange={vi.fn()}
      {...props}
    />
  );

const presetValues = () =>
  screen
    .getAllByRole('radio', { hidden: true })
    .map(radio => radio.getAttribute('value'))
    .filter(value => value !== '0');

describe('FlimmerPaymentAmountPicker', () => {
  it('offers 10, 15 and 20 francs when the member plan has no presets', () => {
    renderPicker();

    expect(presetValues()).toEqual(['1000', '1500', '2000']);
    expect(
      screen.getByRole('radio', { name: 'CHF 15', hidden: true })
    ).toBeChecked();
  });

  it('offers the presets of the member plan when it has some', () => {
    renderPicker({ presetAmounts: [500, 5000], value: 5000 });

    expect(presetValues()).toEqual(['500', '5000']);
  });
});
