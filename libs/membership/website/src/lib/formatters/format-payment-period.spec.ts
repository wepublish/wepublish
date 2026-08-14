import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  formatAfterFirstPaymentPeriod,
  formatFirstPaymentPeriod,
  formatPaymentPeriod,
  formatPaymentTimeline,
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
