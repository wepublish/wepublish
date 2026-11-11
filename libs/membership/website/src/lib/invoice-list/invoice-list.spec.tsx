import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockInvoice,
  mockPaymentMethod,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullInvoiceFragment } from '@wepublish/website/api';
import { BuilderInvoiceListProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { InvoiceList } from './invoice-list';

const subscription = mockSubscription({
  paymentMethod: mockPaymentMethod({ id: 'payrexx-method', slug: 'payrexx' }),
});

const unpaidInvoice = mockInvoice({ id: '1', paidAt: null, subscription });
const paidInvoice = mockInvoice({ id: '2', subscription });
const canceledInvoice = mockInvoice({
  id: '3',
  paidAt: null,
  canceledAt: '2023-04-04T00:00:00.000Z',
  subscription,
});
const bexioInvoice = mockInvoice({
  id: '4',
  paidAt: null,
  subscription: {
    ...subscription,
    paymentMethod: mockPaymentMethod({ slug: 'bexio-invoice' }),
  },
});
const sepaInvoice = mockInvoice({
  id: '5',
  paidAt: null,
  subscription: {
    ...subscription,
    paymentMethod: mockPaymentMethod({ description: 'sepa' }),
  },
});
const payrexxSubscriptionInvoice = mockInvoice({
  id: '6',
  paidAt: null,
  subscription: {
    ...subscription,
    paymentMethod: mockPaymentMethod({
      paymentProviderID: 'payrexx-subscription',
    }),
  },
});
const invoiceWithoutSubscription = mockInvoice({
  id: '7',
  paidAt: null,
  subscription: null,
});

const renderInvoiceList = (
  invoices: FullInvoiceFragment[] | undefined,
  props: Partial<BuilderInvoiceListProps> = {}
) => {
  const onPay = vi.fn<NonNullable<BuilderInvoiceListProps['onPay']>>(
    async () => undefined
  );

  renderWithProviders(
    <InvoiceList
      data={invoices && { __typename: 'Query', userInvoices: invoices }}
      loading={false}
      error={undefined}
      onPay={onPay}
      {...props}
    />
  );

  return { onPay, user: userEvent.setup() };
};

const headings = () =>
  screen.queryAllByRole('heading').map(heading => heading.textContent);
const payButtons = () =>
  screen.queryAllByRole('button', { name: t('invoice.payNow') });

describe('InvoiceList', () => {
  it('shows every invoice with its state', () => {
    renderInvoiceList([unpaidInvoice, paidInvoice, canceledInvoice]);

    expect(headings()).toEqual([
      expect.stringContaining(t('invoice.unpaid')),
      expect.stringContaining(t('invoice.paid')),
      expect.stringContaining(t('invoice.canceled')),
    ]);
  });

  it('pays the open invoice with the payment method of its subscription', async () => {
    const { user, onPay } = renderInvoiceList([unpaidInvoice, paidInvoice]);

    await user.click(payButtons()[0]);

    expect(onPay).toHaveBeenCalledWith('1', 'payrexx-method');
  });

  it('only offers to pay open invoices the reader has to pay by hand', () => {
    renderInvoiceList([
      unpaidInvoice,
      paidInvoice,
      canceledInvoice,
      bexioInvoice,
      sepaInvoice,
      invoiceWithoutSubscription,
    ]);

    expect(payButtons()).toHaveLength(1);
  });

  it('explains bexio and SEPA invoices instead of offering to pay them', () => {
    renderInvoiceList([bexioInvoice, sepaInvoice]);

    expect(
      screen.getAllByRole('alert').map(alert => alert.textContent)
    ).toEqual([t('invoice.bexioWarning'), t('invoice.sepaWarning')]);
    expect(payButtons()).toHaveLength(0);
  });

  it('warns about outdated payrexx subscriptions and still lets them be paid', () => {
    renderInvoiceList([payrexxSubscriptionInvoice]);

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('invoice.payrexxWarning')
    );
    expect(payButtons()).toHaveLength(1);
  });

  it('says there are no open invoices when there are none', () => {
    renderInvoiceList([]);

    expect(screen.getByText(t('invoice.noOpenInvoices'))).toBeInTheDocument();
  });

  it('shows neither invoices nor the empty message while loading', () => {
    renderInvoiceList([unpaidInvoice], { loading: true });

    expect(screen.queryByText(t('invoice.noOpenInvoices'))).toBeNull();
    expect(headings()).toEqual([]);
  });

  it('shows the error instead of the empty message', () => {
    renderInvoiceList(undefined, { error: new Error('Network down') });

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    expect(screen.queryByText(t('invoice.noOpenInvoices'))).toBeNull();
  });
});
