import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  formatAfterFirstPaymentPeriod,
  formatFirstPaymentPeriod,
  formatPaymentPeriod,
  formatPaymentTimeline,
  getAdvertisedYearlyAmount,
  getPaymentPeriodicyMonths,
} from './format-payment-period';

describe('formatFirstPaymentPeriod', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ])('should format the first payment period for %s', periodicity => {
    expect(formatFirstPaymentPeriod(periodicity)).toMatchSnapshot();
  });
});

describe('formatAfterFirstPaymentPeriod', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ])('should format the period after the first one for %s', periodicity => {
    expect(formatAfterFirstPaymentPeriod(periodicity)).toMatchSnapshot();
  });
});

describe('formatPaymentPeriod', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ])('should format payment period for %s', periodicity => {
    expect(formatPaymentPeriod(periodicity)).toMatchSnapshot();
  });
});

describe('formatPaymentTimeline', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ])('should format payment timeline for %s', periodicity => {
    expect(formatPaymentTimeline(periodicity)).toMatchSnapshot();
  });
});

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
