import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockInvoice,
  mockMemberPlan,
  mockOperation,
  mockPayment,
  mockPaymentMethod,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  CheckInvoiceStatusDocument,
  FullInvoiceFragment,
  InvoicesDocument,
  PayInvoiceDocument,
  PaymentPeriodicity,
  SubscribeDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { InvoiceListContainer } from './invoice-list-container';

const payrexx = mockPaymentMethod({
  id: 'payrexx',
  slug: 'payrexx',
  paymentProviderID: 'payrexx',
});
const payrexxSubscription = mockPaymentMethod({
  id: 'payrexx-subscription',
  slug: 'payrexx-subscription',
  paymentProviderID: 'payrexx-subscription',
});

const memberPlan = mockMemberPlan({
  id: 'member-plan',
  name: 'Jahresabo',
  availablePaymentMethods: [
    mockAvailablePaymentMethod({ paymentMethods: [payrexx] }),
  ],
});

const subscription = mockSubscription({
  id: 'subscription',
  memberPlan,
  paymentMethod: payrexx,
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  monthlyAmount: 2500,
  autoRenew: true,
});

const openInvoice = mockInvoice({
  id: 'open-invoice',
  paidAt: null,
  subscription,
});

const paidAt = '2023-01-15T00:00:00.000Z';

const invoicesQuery = (invoices: FullInvoiceFragment[]) =>
  mockOperation(InvoicesDocument, {
    data: { __typename: 'Query', userInvoices: invoices },
  });

const checkInvoiceStatus = (invoice: FullInvoiceFragment) =>
  mockOperation(CheckInvoiceStatusDocument, {
    variables: { id: invoice.id },
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', checkInvoiceStatus: invoice },
  });

const pendingPayment = mockPayment({
  intentSecret: 'payrexx-intent',
  paymentMethod: payrexx,
});

const findPayButton = () =>
  screen.findByRole('button', { name: t('invoice.payNow') });
const payButtons = () =>
  screen.queryAllByRole('button', { name: t('invoice.payNow') });

describe('InvoiceListContainer', () => {
  it('shows the invoices of the reader', async () => {
    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        invoicesQuery([mockInvoice({ id: 'paid-invoice', subscription })]),
      ],
    });

    expect(await screen.findByRole('heading')).toHaveTextContent(
      `${t('invoice.paid')} für Jahresabo`
    );
  });

  it('checks every open invoice and shows the ones paid meanwhile', async () => {
    const stillOpen = mockInvoice({
      id: 'still-open',
      paidAt: null,
      subscription,
    });

    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        invoicesQuery([openInvoice, stillOpen]),
        checkInvoiceStatus({ ...openInvoice, paidAt }),
        checkInvoiceStatus(stillOpen),
      ],
    });

    expect(
      await screen.findByText(t('invoice.paidAt'), { exact: false })
    ).toBeInTheDocument();
    expect(payButtons()).toHaveLength(1);
  });

  it('sends no status check for invoices that are already paid or canceled', async () => {
    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        invoicesQuery([
          mockInvoice({ id: 'paid', subscription }),
          mockInvoice({
            id: 'canceled',
            paidAt: null,
            canceledAt: '2023-01-01T00:00:00.000Z',
            subscription,
          }),
        ]),
      ],
    });

    expect(await screen.findAllByRole('heading')).toHaveLength(2);
  });

  it('starts the payment of an open invoice with the redirect pages of its plan', async () => {
    const user = userEvent.setup();
    const data = {
      __typename: 'Mutation' as const,
      createPaymentFromInvoice: pendingPayment,
    };
    const payInvoice = vi.fn(() => ({ data }));

    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        invoicesQuery([openInvoice]),
        checkInvoiceStatus(openInvoice),
        {
          ...mockOperation(PayInvoiceDocument, {
            variables: {
              invoiceId: 'open-invoice',
              paymentMethodId: 'payrexx',
              successURL: 'https://example.com/success',
              failureURL: 'https://example.com/fail',
            },
            data,
          }),
          result: payInvoice,
        },
      ],
    });

    await user.click(await findPayButton());

    await waitFor(() => expect(payInvoice).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('moves an outdated payrexx subscription to payrexx when its invoice is paid', async () => {
    const user = userEvent.setup();
    const outdated = mockInvoice({
      id: 'outdated-invoice',
      paidAt: null,
      subscription: { ...subscription, paymentMethod: payrexxSubscription },
    });
    const data = {
      __typename: 'Mutation' as const,
      createUserSubscription: pendingPayment,
    };
    const subscribe = vi.fn(() => ({ data }));

    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        invoicesQuery([outdated]),
        checkInvoiceStatus(outdated),
        {
          ...mockOperation(SubscribeDocument, {
            variables: {
              deactivateSubscriptionId: 'subscription',
              memberPlanId: 'member-plan',
              paymentMethodId: 'payrexx',
              autoRenew: true,
              monthlyAmount: 2500,
              paymentPeriodicity: PaymentPeriodicity.Quarterly,
              successURL: 'https://example.com/success',
              failureURL: 'https://example.com/fail',
            },
            data,
          }),
          result: subscribe,
        },
      ],
    });

    await user.click(await findPayButton());

    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
  });

  it('explains that an outdated subscription cannot be moved when its plan lacks payrexx', async () => {
    const user = userEvent.setup();
    const outdated = mockInvoice({
      id: 'outdated-invoice',
      paidAt: null,
      subscription: {
        ...subscription,
        paymentMethod: payrexxSubscription,
        memberPlan: {
          ...memberPlan,
          availablePaymentMethods: [
            mockAvailablePaymentMethod({
              paymentMethods: [payrexxSubscription],
            }),
          ],
        },
      },
    });

    renderWithProviders(<InvoiceListContainer />, {
      mocks: [invoicesQuery([outdated]), checkInvoiceStatus(outdated)],
    });

    await user.click(await findPayButton());

    expect(
      await screen.findByText(
        'Der benötigte Payment-Adapter konnte nicht gefunden werden.'
      )
    ).toBeInTheDocument();
  });

  it('only shows the invoices the filter keeps', async () => {
    renderWithProviders(
      <InvoiceListContainer
        filter={invoices => invoices.filter(({ paidAt }) => !paidAt)}
      />,
      {
        mocks: [
          invoicesQuery([
            openInvoice,
            mockInvoice({ id: 'paid', subscription }),
          ]),
          checkInvoiceStatus(openInvoice),
        ],
      }
    );

    expect(await screen.findAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading')).toHaveTextContent(t('invoice.unpaid'));
  });

  it('shows why the invoices could not be loaded', async () => {
    renderWithProviders(<InvoiceListContainer />, {
      mocks: [
        mockOperation(InvoicesDocument, {
          errors: [{ message: 'Not authenticated' }],
        }),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Not authenticated'
    );
  });
});
