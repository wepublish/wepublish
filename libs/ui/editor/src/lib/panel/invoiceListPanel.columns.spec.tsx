import { InvoiceFragment } from '@wepublish/editor/api';
import { render, screen } from '@testing-library/react';
import { invoiceColumns } from './invoiceListPanel';

const t = ((key: string) => key) as unknown as Parameters<
  typeof invoiceColumns
>[0]['t'];

const invoice = (over: Partial<InvoiceFragment> = {}): InvoiceFragment =>
  ({
    __typename: 'Invoice',
    id: 'invoice-1',
    total: 6500,
    currency: 'CHF',
    items: [
      {
        name: 'Jahresabo',
        description: null,
        quantity: 1,
        amount: 6500,
        total: 6500,
        goodieId: null,
        goodie: null,
      },
    ],
    dueAt: '2026-01-01T00:00:00.000Z',
    paidAt: null,
    canceledAt: null,
    description: 'yearly renewal',
    mail: 'reader@example.com',
    manuallySetAsPaidByUserId: null,
    manuallySetAsPaidByUser: null,
    scheduledDeactivationAt: '2026-01-06T00:00:00.000Z',
    createdAt: '2025-12-18T00:00:00.000Z',
    modifiedAt: '2026-04-07T00:00:00.000Z',
    payments: [],
    ...over,
  }) as unknown as InvoiceFragment;

const payment = (
  state: string,
  method: string,
  createdAt = '2026-03-01T00:00:00.000Z'
) => ({
  __typename: 'Payment',
  id: `${state}-${method}`,
  state,
  createdAt,
  paymentMethod: { id: method, name: method, paymentProviderID: method },
});

const columns = invoiceColumns({ t, disabled: false, onPay: vi.fn() });
const column = (id: string) => columns.find(c => c.id === id)!;
const cell = (id: string, row: InvoiceFragment) => {
  const { container } = render(<>{column(id).render(row)}</>);
  return container.textContent;
};

describe('invoice columns', () => {
  it('show the date an invoice was paid by default', () => {
    expect(column('paidAt').defaultHidden).toBeFalsy();
    expect(
      cell('paidAt', invoice({ paidAt: '2026-04-07T10:00:00.000Z' }))
    ).toBe('7.4.2026');
  });

  it('mark an unpaid invoice in the paid column', () => {
    expect(cell('paidAt', invoice())).toBe('—');
  });

  it.each([
    'paidVia',
    'paymentState',
    'manuallyPaidBy',
    'canceledAt',
    'scheduledDeactivationAt',
    'createdAt',
    'modifiedAt',
    'mail',
    'positions',
  ])('offer %s, hidden until switched on', id => {
    expect(column(id).defaultHidden).toBe(true);
    // a plain label, so the column menu can list it
    expect(typeof column(id).label).toBe('string');
  });

  it('name the payment method of the payment that settled the invoice', () => {
    const row = invoice({
      payments: [
        payment('canceled', 'Payrexx', '2026-02-01T00:00:00.000Z'),
        payment('paid', 'bexio', '2026-03-01T00:00:00.000Z'),
      ],
    } as Partial<InvoiceFragment>);

    expect(cell('paidVia', row)).toBe('bexio');
    expect(cell('paymentState', row)).toBe('invoice.paymentState.paid');
  });

  it('name the latest attempt when nothing was paid yet', () => {
    const row = invoice({
      payments: [payment('processing', 'Payrexx')],
    } as Partial<InvoiceFragment>);

    expect(cell('paidVia', row)).toBe('Payrexx');
    expect(cell('paymentState', row)).toBe('invoice.paymentState.processing');
  });

  // imported invoices were paid in another system, without a payment
  it('show a dash for an invoice without payments', () => {
    expect(cell('paidVia', invoice())).toBe('—');
    expect(cell('paymentState', invoice())).toBe('—');
  });

  it('name who marked an invoice as paid by hand', () => {
    const row = invoice({
      manuallySetAsPaidByUser: {
        __typename: 'User',
        id: 'u1',
        firstName: 'Anna',
        name: 'Muster',
      },
    } as Partial<InvoiceFragment>);

    expect(cell('manuallyPaidBy', row)).toBe('Anna Muster');
    expect(cell('manuallyPaidBy', invoice())).toBe('—');
  });

  it('list the positions with their quantities', () => {
    expect(cell('positions', invoice())).toBe('1 × Jahresabo');
  });

  it('export dates as dates', () => {
    const row = invoice({ paidAt: '2026-04-07T10:00:00.000Z' });

    expect(column('paidAt').exportValue).toBeInstanceOf(Function);
    expect(
      (column('paidAt').exportValue as (r: InvoiceFragment) => unknown)(row)
    ).toEqual(new Date('2026-04-07T10:00:00.000Z'));
  });

  it('keep the "pay manually" button for open invoices', () => {
    render(<>{column('action').render(invoice())}</>);

    expect(
      screen.getByRole('button', { name: 'invoice.payManually' })
    ).toBeInTheDocument();
  });
});
