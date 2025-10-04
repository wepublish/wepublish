import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  formatPaymentPeriod,
  formatPaymentTimeline,
  getPaymentPeriodicyMonths,
} from './format-payment-period';

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
