import { PaymentPeriodicity } from '@wepublish/editor/api';

import {
  getPeriodPriceRange,
  getPlanPeriodicities,
} from './periodicity-pricing';

const price = (
  periodicity: PaymentPeriodicity,
  amountMin: number | null,
  amountTarget: number | null = null,
  amountMax: number | null = null
) => ({ periodicity, amountMin, amountTarget, amountMax });

describe('getPeriodPriceRange', () => {
  it('uses the row of the periodicity', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            price(PaymentPeriodicity.Monthly, 1000),
            price(PaymentPeriodicity.Yearly, 9000, 12000, 15000),
          ],
        },
        PaymentPeriodicity.Yearly
      )
    ).toEqual({ amountMin: 9000, amountTarget: 12000, amountMax: 15000 });
  });

  it('derives a periodicity without its own row from the monthly row', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [price(PaymentPeriodicity.Monthly, 1000, 1500)],
        },
        PaymentPeriodicity.Yearly
      )
    ).toEqual({ amountMin: 12000, amountTarget: 18000, amountMax: null });
  });

  it('derives from the cheapest row per month when there is no monthly row', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            price(PaymentPeriodicity.Quarterly, 3300),
            price(PaymentPeriodicity.Yearly, 12000),
            price(PaymentPeriodicity.Lifetime, 100),
          ],
        },
        PaymentPeriodicity.Monthly
      )
    ).toEqual({ amountMin: 1000, amountTarget: null, amountMax: null });
  });

  it('fills missing fields of a row from the base row', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            price(PaymentPeriodicity.Monthly, 1000, 1500),
            price(PaymentPeriodicity.Yearly, 10000),
          ],
        },
        PaymentPeriodicity.Yearly
      )
    ).toEqual({ amountMin: 10000, amountTarget: 18000, amountMax: null });
  });

  it('is free without any price', () => {
    expect(
      getPeriodPriceRange({ periodicityPricing: [] }, PaymentPeriodicity.Yearly)
    ).toEqual({ amountMin: 0, amountTarget: null, amountMax: null });
  });
});

describe('getPlanPeriodicities', () => {
  it('lists every periodicity the payment config sells once, in order', () => {
    expect(
      getPlanPeriodicities({
        availablePaymentMethods: [
          {
            paymentPeriodicities: [
              PaymentPeriodicity.Yearly,
              PaymentPeriodicity.Monthly,
            ],
          },
          { paymentPeriodicities: [PaymentPeriodicity.Yearly] },
        ],
      })
    ).toEqual([PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly]);
  });

  it('sells nothing without a payment config', () => {
    expect(getPlanPeriodicities({ availablePaymentMethods: null })).toEqual([]);
  });
});
