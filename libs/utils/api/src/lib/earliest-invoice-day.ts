import { PaymentPeriodicity } from '@prisma/client';
import { mapPaymentPeriodToMonths } from './payment-period-to-months';

/**
 * How many days before a subscription ends its next invoice may be created at
 * the earliest, as a negative number of days. A subscription is only invoiced
 * once its current period has begun, so an earlier day could not be kept: the
 * period is shorter than the lead. Each value leaves a few days after the
 * period begins.
 */
export const EARLIEST_INVOICE_DAY: Record<PaymentPeriodicity, number> = {
  [PaymentPeriodicity.monthly]: -25,
  [PaymentPeriodicity.quarterly]: -85,
  [PaymentPeriodicity.biannual]: -175,
  [PaymentPeriodicity.yearly]: -360,
  [PaymentPeriodicity.biennial]: -720,
  [PaymentPeriodicity.lifetime]: -720,
};

/** The periodicity with the shortest period, if there is any. */
export function shortestPeriodicity(
  periodicities: PaymentPeriodicity[]
): PaymentPeriodicity | undefined {
  return [...periodicities].sort(
    (a, b) => mapPaymentPeriodToMonths(a) - mapPaymentPeriodToMonths(b)
  )[0];
}

/**
 * The earliest invoice day that suits every one of the periodicities: that of
 * the shortest. Without any periodicity it is as careful as for monthly.
 */
export function earliestInvoiceDay(periodicities: PaymentPeriodicity[]) {
  return EARLIEST_INVOICE_DAY[
    shortestPeriodicity(periodicities) ?? PaymentPeriodicity.monthly
  ];
}

/** The earliest invoice day of every periodicity, shortest period first. */
export function earliestInvoiceDays() {
  return (Object.keys(EARLIEST_INVOICE_DAY) as PaymentPeriodicity[])
    .sort((a, b) => mapPaymentPeriodToMonths(a) - mapPaymentPeriodToMonths(b))
    .map(periodicity => ({
      periodicity,
      days: EARLIEST_INVOICE_DAY[periodicity],
    }));
}
