import { mockAvailablePaymentMethod } from '@wepublish/mocks/website';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';

import {
  formatMembershipPrice,
  getMembershipPeriodicity,
} from './tsri-membership-price';

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

describe('getMembershipPeriodicity', () => {
  const yearlyByDefault = {
    periodicityPricing: [],
    defaultPaymentPeriodicity: PaymentPeriodicity.Yearly,
    availablePaymentMethods: [
      mockAvailablePaymentMethod({
        paymentPeriodicities: [
          PaymentPeriodicity.Monthly,
          PaymentPeriodicity.Yearly,
        ],
      }),
    ],
  };

  it('takes the toggled periodicity when the plan bills it', () => {
    expect(
      getMembershipPeriodicity(yearlyByDefault, PaymentPeriodicity.Monthly)
    ).toBe(PaymentPeriodicity.Monthly);
  });

  it("falls back to the plan's default otherwise", () => {
    expect(
      getMembershipPeriodicity(yearlyByDefault, PaymentPeriodicity.Lifetime)
    ).toBe(PaymentPeriodicity.Yearly);
    expect(getMembershipPeriodicity(yearlyByDefault)).toBe(
      PaymentPeriodicity.Yearly
    );
  });
});
