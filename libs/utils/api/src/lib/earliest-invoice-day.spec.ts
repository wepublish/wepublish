import { PaymentPeriodicity } from '@prisma/client';
import {
  EARLIEST_INVOICE_DAY,
  earliestInvoiceDay,
  earliestInvoiceDays,
  shortestPeriodicity,
} from './earliest-invoice-day';

describe('earliestInvoiceDay', () => {
  it('leaves a monthly subscription a few days before its next invoice', () => {
    expect(earliestInvoiceDay([PaymentPeriodicity.monthly])).toBe(-25);
  });

  it('allows a longer lead the longer the period is', () => {
    expect(earliestInvoiceDay([PaymentPeriodicity.quarterly])).toBe(-85);
    expect(earliestInvoiceDay([PaymentPeriodicity.biannual])).toBe(-175);
    expect(earliestInvoiceDay([PaymentPeriodicity.yearly])).toBe(-360);
    expect(earliestInvoiceDay([PaymentPeriodicity.biennial])).toBe(-720);
    expect(earliestInvoiceDay([PaymentPeriodicity.lifetime])).toBe(-720);
  });

  it('follows the shortest of several periodicities', () => {
    expect(
      earliestInvoiceDay([
        PaymentPeriodicity.yearly,
        PaymentPeriodicity.quarterly,
        PaymentPeriodicity.biennial,
      ])
    ).toBe(-85);
  });

  it('is as careful as for monthly when no periodicity is known', () => {
    expect(earliestInvoiceDay([])).toBe(-25);
  });

  it('knows a day for every periodicity', () => {
    expect(Object.keys(EARLIEST_INVOICE_DAY).sort()).toEqual(
      Object.values(PaymentPeriodicity).sort()
    );
  });
});

describe('shortestPeriodicity', () => {
  it('picks the periodicity with the fewest months', () => {
    expect(
      shortestPeriodicity([
        PaymentPeriodicity.yearly,
        PaymentPeriodicity.monthly,
        PaymentPeriodicity.quarterly,
      ])
    ).toBe(PaymentPeriodicity.monthly);
  });

  it('has nothing to pick from an empty list', () => {
    expect(shortestPeriodicity([])).toBeUndefined();
  });
});

describe('earliestInvoiceDays', () => {
  it('lists every periodicity from the shortest to the longest', () => {
    expect(earliestInvoiceDays()[0]).toEqual({
      periodicity: PaymentPeriodicity.monthly,
      days: -25,
    });
    expect(earliestInvoiceDays()).toHaveLength(
      Object.values(PaymentPeriodicity).length
    );
  });
});
