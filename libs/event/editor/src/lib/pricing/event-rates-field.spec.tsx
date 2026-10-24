import { fireEvent, screen } from '@testing-library/react';
import { EventSpecialRate } from '@wepublish/editor/api';

import { formValues, renderInForm } from '../test-helpers';
import { EventRatesField } from './event-rates-field';
import { EventSpecialRateField } from './event-special-rate-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

describe('EventRatesField', () => {
  it('adds a price row with labelled price and designation fields', () => {
    renderInForm(<EventRatesField />);

    fireEvent.click(screen.getByRole('button', { name: 'agenda.rates.add' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.rates.price 1' }),
      { target: { value: 'CHF 25' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.rates.designation 1' }),
      { target: { value: 'Reduced' } }
    );

    expect(formValues().rates.map(({ value }) => value)).toEqual([
      { price: 'CHF 25', designation: 'Reduced' },
    ]);
  });

  it('shows a missing price at the row after submitting', async () => {
    renderInForm(<EventRatesField />, {
      defaultValues: {
        rates: [{ id: 'r', value: { price: '', designation: 'Reduced' } }],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(
      await screen.findByText('agenda.form.errors.ratePrice')
    ).toBeInTheDocument();
  });
});

describe('EventSpecialRateField', () => {
  it('is a group of radios that stores the chosen rate, and none as null', () => {
    renderInForm(<EventSpecialRateField />, {
      defaultValues: { specialRate: EventSpecialRate.FreePrice },
    });

    expect(
      screen.getByRole('radiogroup', { name: 'agenda.rates.specialRate' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'agenda.rates.special.FreePrice' })
    ).toBeChecked();

    fireEvent.click(
      screen.getByRole('radio', { name: 'agenda.rates.special.FreeEntry' })
    );
    expect(formValues().specialRate).toBe(EventSpecialRate.FreeEntry);

    fireEvent.click(
      screen.getByRole('radio', { name: 'agenda.rates.special.none' })
    );
    expect(formValues().specialRate).toBeNull();
  });
});
