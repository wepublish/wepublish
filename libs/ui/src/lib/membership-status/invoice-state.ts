export type InvoiceState = 'paid' | 'canceled' | 'unpaid';

export type InvoiceStateInput = {
  paidAt?: string | Date | null;
  canceledAt?: string | Date | null;
};

/** Paid wins over cancelled: money that came in stays visible. */
export function getInvoiceState(invoice: InvoiceStateInput): InvoiceState {
  if (invoice.paidAt) {
    return 'paid';
  }

  if (invoice.canceledAt) {
    return 'canceled';
  }

  return 'unpaid';
}

export const isInvoiceOpen = (invoice: InvoiceStateInput) =>
  getInvoiceState(invoice) === 'unpaid';
