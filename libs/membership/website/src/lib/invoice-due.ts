import { isInvoiceOpen } from '@wepublish/ui';
import { FullInvoiceFragment } from '@wepublish/website/api';

import { isSubscriptionActive } from './subscription-state';

type DueInput = Pick<
  FullInvoiceFragment,
  'id' | 'dueAt' | 'paidAt' | 'canceledAt' | 'subscriptionID' | 'subscription'
>;

const time = (date: string) => new Date(date).getTime();

/**
 * Whether an open invoice asks the reader to act now. Not when the reader has
 * paid a later invoice of the same subscription since (it is left over, e.g.
 * from an import), nor once its subscription has ended. The system cancels an
 * unpaid invoice when it deactivates the subscription, so such invoices only
 * stay open by exception.
 */
export const isInvoiceDue = (invoice: DueInput, invoices: DueInput[]) => {
  if (!isInvoiceOpen(invoice)) {
    return false;
  }

  if (invoice.subscription && !isSubscriptionActive(invoice.subscription)) {
    return false;
  }

  return !invoices.some(
    other =>
      other.id !== invoice.id &&
      other.subscriptionID === invoice.subscriptionID &&
      !!other.paidAt &&
      time(other.dueAt) > time(invoice.dueAt)
  );
};
