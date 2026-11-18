import { Currency } from '@wepublish/website/api';

import { formatMembershipPrice } from './tsri-membership-price';

describe('formatMembershipPrice', () => {
  it.each([
    [1500, Currency.Chf, 'CHF 15'],
    [2000, Currency.Eur, 'EUR 20'],
    [1550, Currency.Chf, 'CHF 15.50'],
    [1550, Currency.Eur, 'EUR 15.50'],
  ])('formats %i %s as %s', (cents, currency, expected) => {
    expect(formatMembershipPrice(cents, currency, 'de-CH')).toBe(expected);
  });
});
