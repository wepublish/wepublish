import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  getAdvertisedYearlyAmount,
  getPaymentPeriodicyMonths,
} from './format-payment-period';

describe('getPaymentPeriodicyMonths', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ])('should get the payment periodicty month for %s', periodicity => {
    expect(getPaymentPeriodicyMonths(periodicity)).toMatchSnapshot();
  });
});

describe('getAdvertisedYearlyAmount', () => {
  const price = (periodicity: PaymentPeriodicity, amountMin: number) => ({
    periodicity,
    amountMin,
    amountTarget: null,
    amountMax: null,
  });

  it('shows the full price of a lifetime plan', () => {
    const lifetime = {
      periodicityPricing: [price(PaymentPeriodicity.Lifetime, 183200)],
    };

    expect(
      getAdvertisedYearlyAmount(lifetime, PaymentPeriodicity.Lifetime)
    ).toBe(1832);
  });

  it('shows a yearly price for plans priced per month', () => {
    const monthly = {
      periodicityPricing: [price(PaymentPeriodicity.Monthly, 1600)],
    };

    expect(getAdvertisedYearlyAmount(monthly, PaymentPeriodicity.Yearly)).toBe(
      192
    );
    expect(getAdvertisedYearlyAmount(monthly, PaymentPeriodicity.Monthly)).toBe(
      192
    );
  });

  it('shows the yearly price of plans priced per year', () => {
    const yearly = {
      periodicityPricing: [
        price(PaymentPeriodicity.Monthly, 1600),
        price(PaymentPeriodicity.Yearly, 10000),
      ],
    };

    expect(getAdvertisedYearlyAmount(yearly, PaymentPeriodicity.Yearly)).toBe(
      100
    );
  });

  it('ignores a yearly row without a minimum amount', () => {
    const labelOnly = {
      periodicityPricing: [
        price(PaymentPeriodicity.Monthly, 1600),
        { ...price(PaymentPeriodicity.Yearly, 0), amountMin: null },
      ],
    };

    expect(
      getAdvertisedYearlyAmount(labelOnly, PaymentPeriodicity.Yearly)
    ).toBe(192);
  });

  it('shows the price of the whole period for a single offer', () => {
    const monthly = {
      periodicityPricing: [price(PaymentPeriodicity.Monthly, 1600)],
    };

    expect(
      getAdvertisedYearlyAmount(monthly, PaymentPeriodicity.Monthly, true)
    ).toBe(16);
    expect(
      getAdvertisedYearlyAmount(monthly, PaymentPeriodicity.Quarterly, true)
    ).toBe(48);
    expect(
      getAdvertisedYearlyAmount(monthly, PaymentPeriodicity.Yearly, true)
    ).toBe(192);
  });
});
