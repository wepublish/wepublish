import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockInvoice,
  mockMemberPlan,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { Currency } from '@wepublish/website/api';
import { BuilderInvoiceListItemProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { InvoiceListItem } from './invoice-list-item';

const subscription = mockSubscription({
  memberPlan: mockMemberPlan({ name: 'Jahresabo' }),
});

const paidInvoice = mockInvoice({
  id: '4321-4321',
  createdAt: '2023-01-01T00:00:00.000Z',
  dueAt: '2023-01-31T00:00:00.000Z',
  paidAt: '2023-01-15T00:00:00.000Z',
  total: 12550,
  subscription,
});

const renderInvoiceListItem = (
  props: Partial<BuilderInvoiceListItemProps> = {}
) => {
  const pay = vi.fn(async () => undefined);

  renderWithProviders(
    <InvoiceListItem
      {...paidInvoice}
      canPay={false}
      pay={pay}
      {...props}
    />
  );

  return { pay, user: userEvent.setup() };
};

const unpaid = { paidAt: null, canPay: true };
const payButton = () =>
  screen.getByRole('button', { name: t('invoice.payNow') });
const queryPayButton = () =>
  screen.queryByRole('button', { name: t('invoice.payNow') });
const metaLine = (key: string) =>
  screen.getByText(content => content.startsWith(t(key)));

describe('InvoiceListItem', () => {
  it('shows a paid invoice with its plan, number, amount and payment date', () => {
    renderInvoiceListItem();

    expect(screen.getByRole('heading')).toHaveTextContent(
      `${t('invoice.paid')} für Jahresabo`
    );
    expect(metaLine('invoice.number')).toHaveTextContent('4321-4321');
    expect(metaLine('invoice.amount')).toHaveTextContent('CHF 125.50');
    expect(metaLine('invoice.paidAt').querySelector('time')).toHaveAttribute(
      'dateTime',
      paidInvoice.paidAt
    );
    expect(queryPayButton()).not.toBeInTheDocument();
  });

  it('shows an open invoice with its due date', () => {
    renderInvoiceListItem(unpaid);

    expect(screen.getByRole('heading')).toHaveTextContent(
      `${t('invoice.unpaid')} für Jahresabo`
    );
    expect(metaLine('invoice.dueAt').querySelector('time')).toHaveAttribute(
      'dateTime',
      paidInvoice.dueAt
    );
    expect(
      screen.queryByText(t('invoice.paidAt'), { exact: false })
    ).not.toBeInTheDocument();
  });

  it('shows a canceled invoice with its cancellation date', () => {
    renderInvoiceListItem({
      paidAt: null,
      canceledAt: '2023-02-01T00:00:00.000Z',
    });

    expect(screen.getByRole('heading')).toHaveTextContent(
      `${t('invoice.canceled')} für Jahresabo`
    );
    expect(
      metaLine('invoice.canceledAt').querySelector('time')
    ).toHaveAttribute('dateTime', '2023-02-01T00:00:00.000Z');
    expect(queryPayButton()).not.toBeInTheDocument();
  });

  it('leaves out the plan when the invoice has no subscription', () => {
    renderInvoiceListItem({ subscription: null });

    expect(screen.getByRole('heading')).toHaveTextContent(t('invoice.paid'));
    expect(screen.getByRole('heading')).not.toHaveTextContent('für');
    expect(metaLine('invoice.amount')).toHaveTextContent('CHF 125.50');
  });

  it('shows the amount in the currency of the member plan', () => {
    renderInvoiceListItem({
      subscription: {
        ...subscription,
        memberPlan: { ...subscription.memberPlan, currency: Currency.Eur },
      },
    });

    expect(metaLine('invoice.amount')).toHaveTextContent('EUR 125.50');
  });

  it('pays the invoice', async () => {
    const { user, pay } = renderInvoiceListItem(unpaid);

    await user.click(payButton());

    expect(pay).toHaveBeenCalledTimes(1);
  });

  it('disables paying while the payment starts', async () => {
    const { user } = renderInvoiceListItem({
      ...unpaid,
      pay: vi.fn(() => new Promise<void>(() => undefined)),
    });

    await user.click(payButton());

    expect(payButton()).toBeDisabled();
  });

  it('shows why the payment failed and lets the reader try again', async () => {
    const { user } = renderInvoiceListItem({
      ...unpaid,
      pay: vi.fn(async () => {
        throw new Error('Card declined');
      }),
    });

    await user.click(payButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Card declined');
    expect(payButton()).toBeEnabled();
  });

  it('explains that bexio invoices arrive as PDF', () => {
    renderInvoiceListItem({ paidAt: null, isBexio: true });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('invoice.bexioWarning')
    );
  });

  it('explains the direct debit and hides the due date for SEPA invoices', () => {
    renderInvoiceListItem({ paidAt: null, isSepa: true });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('invoice.sepaWarning')
    );
    expect(
      screen.queryByText(t('invoice.dueAt'), { exact: false })
    ).not.toBeInTheDocument();
  });

  it('warns about an outdated payrexx subscription and still offers to pay', () => {
    renderInvoiceListItem({ ...unpaid, isPayrexxSubscription: true });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('invoice.payrexxWarning')
    );
    expect(payButton()).toBeEnabled();
  });
});
