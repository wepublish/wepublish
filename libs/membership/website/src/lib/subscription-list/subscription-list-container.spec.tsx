import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockInvoice,
  mockMemberPlan,
  mockOperation,
  mockPayment,
  mockPaymentMethod,
  mockSubscription,
  mockSubscriptionDeactivation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  CancelSubscriptionDocument,
  CheckInvoiceStatusDocument,
  ExtendSubscriptionDocument,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PaymentPeriodicity,
  ProductType,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionDeactivationReason,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { SubscriptionListContainer } from './subscription-list-container';

const type = ProductType.Subscription;

const subscription = mockSubscription({
  id: 'subscription',
  memberPlan: mockMemberPlan({ name: 'Jahresabo' }),
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  canExtend: true,
});

const deactivation = mockSubscriptionDeactivation({
  date: '2024-02-01T00:00:00.000Z',
  reason: SubscriptionDeactivationReason.UserSelfDeactivated,
});
const cancelledSubscription = { ...subscription, deactivation };

const paidInvoice = mockInvoice({ id: 'paid-invoice', subscription });
const openInvoice = mockInvoice({
  id: 'open-invoice',
  paidAt: null,
  subscription,
});

const subscriptionsQuery = (subscriptions: FullSubscriptionFragment[]) =>
  mockOperation(SubscriptionsDocument, {
    data: { __typename: 'Query', userSubscriptions: subscriptions },
  });

const invoicesQuery = (invoices: FullInvoiceFragment[], delay?: number) =>
  mockOperation(InvoicesDocument, {
    delay,
    data: { __typename: 'Query', userInvoices: invoices },
  });

const checkInvoiceStatus = (invoice: FullInvoiceFragment) =>
  mockOperation(CheckInvoiceStatusDocument, {
    variables: { id: invoice.id },
    data: { __typename: 'Query', checkInvoiceStatus: invoice },
  });

const cancelMutation = mockOperation(CancelSubscriptionDocument, {
  variables: { subscriptionId: 'subscription' },
  data: {
    __typename: 'Mutation',
    cancelUserSubscription: cancelledSubscription,
  },
});

const extendMutation = mockOperation(ExtendSubscriptionDocument, {
  variables: {
    subscriptionId: 'subscription',
    successURL: 'https://example.com/success',
    failureURL: 'https://example.com/fail',
  },
  data: {
    __typename: 'Mutation',
    extendUserSubscription: mockPayment({
      intentSecret: '',
      paymentMethod: mockPaymentMethod({ paymentProviderID: 'payrexx' }),
    }),
  },
});

const button = (key: string, options?: Record<string, unknown>) =>
  screen.getByRole('button', { name: t(key, options) });
const findButton = (key: string, options?: Record<string, unknown>) =>
  screen.findByRole('button', { name: t(key, options) });

const cancel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await findButton('subscription.cancel', { type }));
  await user.click(button('subscription.cancel', { type }));
};

const extend = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await findButton('subscription.extendNow'));
  await user.click(
    button('subscription.extendBy', {
      subscriptionDuration: t('subscription.paymentPeriod.quarterly'),
    })
  );
};

describe('SubscriptionListContainer', () => {
  it('shows the subscriptions of the reader', async () => {
    renderWithProviders(<SubscriptionListContainer />, {
      mocks: [subscriptionsQuery([subscription]), invoicesQuery([])],
    });

    expect(
      await screen.findByRole('heading', { name: 'Jahresabo' })
    ).toBeInTheDocument();
  });

  it('cancels the subscription and shows it as cancelled', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SubscriptionListContainer />, {
      mocks: [
        subscriptionsQuery([subscription]),
        invoicesQuery([paidInvoice]),
        cancelMutation,
      ],
    });

    await cancel(user);

    expect(
      await findButton('subscription.reactivate', { type })
    ).toBeInTheDocument();
    expect(
      screen.getByText(t('subscription.cancelledOn'), { exact: false })
    ).toBeInTheDocument();
  });

  it('shows why cancelling failed', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SubscriptionListContainer />, {
      mocks: [
        subscriptionsQuery([subscription]),
        invoicesQuery([paidInvoice]),
        mockOperation(CancelSubscriptionDocument, {
          variables: { subscriptionId: 'subscription' },
          errors: [{ message: 'Subscription not found' }],
        }),
      ],
    });

    await cancel(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Subscription not found'
    );
  });

  it('reactivates a cancelled subscription and reloads the invoices', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <SubscriptionListContainer />
        <InvoiceListContainer />
      </>,
      {
        mocks: [
          subscriptionsQuery([cancelledSubscription]),
          invoicesQuery([]),
          mockOperation(ReactivateSubscriptionDocument, {
            variables: { subscriptionId: 'subscription' },
            data: {
              __typename: 'Mutation',
              reactivateUserSubscription: subscription,
            },
          }),
          invoicesQuery([paidInvoice]),
        ],
      }
    );

    expect(
      await screen.findByText(t('invoice.noOpenInvoices'))
    ).toBeInTheDocument();

    await user.click(await findButton('subscription.reactivate', { type }));
    await user.click(button('subscription.reactivate', { type }));

    expect(
      await findButton('subscription.cancel', { type })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t('invoice.paid'), { exact: false })
    ).toBeInTheDocument();
  });

  it('reverts an upgrade and reloads the subscriptions and invoices', async () => {
    const user = userEvent.setup();
    const upgraded = {
      ...subscription,
      canRevertUpgrade: true,
      deactivation: mockSubscriptionDeactivation({
        reason: SubscriptionDeactivationReason.UserReplacedSubscription,
      }),
    };
    const previous = mockSubscription({
      id: 'previous',
      memberPlan: mockMemberPlan({ name: 'Monatsabo' }),
    });
    const upgradeInvoice = mockInvoice({
      id: 'upgrade-invoice',
      paidAt: null,
      subscription: upgraded,
    });

    renderWithProviders(
      <>
        <SubscriptionListContainer />
        <InvoiceListContainer />
      </>,
      {
        mocks: [
          subscriptionsQuery([upgraded]),
          invoicesQuery([upgradeInvoice]),
          checkInvoiceStatus(upgradeInvoice),
          mockOperation(RevertSubscriptionUpgradeDocument, {
            variables: { subscriptionId: 'subscription' },
            data: {
              __typename: 'Mutation',
              revertUserSubscriptionUpgrade: previous,
            },
          }),
          subscriptionsQuery([previous]),
          invoicesQuery([]),
        ],
      }
    );

    await user.click(await findButton('subscription.revertUpgrade'));
    await user.click(button('subscription.revertUpgrade'));

    expect(
      await screen.findByRole('heading', { name: 'Monatsabo' })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t('invoice.noOpenInvoices'))
    ).toBeInTheDocument();
  });

  it('marks the open invoices of a cancelled subscription as cancelled', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <SubscriptionListContainer />
        <InvoiceListContainer />
      </>,
      {
        mocks: [
          subscriptionsQuery([subscription]),
          invoicesQuery([openInvoice]),
          checkInvoiceStatus(openInvoice),
          cancelMutation,
        ],
      }
    );

    expect(await findButton('invoice.payNow')).toBeInTheDocument();

    await cancel(user);

    expect(
      await screen.findByText(t('invoice.canceled'), { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('invoice.payNow') })
    ).not.toBeInTheDocument();
  });

  it('extends the subscription with the redirect pages of its plan and reloads the invoices', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <SubscriptionListContainer />
        <InvoiceListContainer />
      </>,
      {
        mocks: [
          subscriptionsQuery([subscription]),
          invoicesQuery([]),
          extendMutation,
          invoicesQuery([paidInvoice]),
        ],
      }
    );

    expect(
      await screen.findByText(t('invoice.noOpenInvoices'))
    ).toBeInTheDocument();

    await extend(user);

    expect(
      await screen.findByText(t('invoice.paid'), { exact: false })
    ).toBeInTheDocument();
  });

  it('shows the subscriptions before the invoices have arrived', async () => {
    renderWithProviders(<SubscriptionListContainer />, {
      mocks: [subscriptionsQuery([subscription]), invoicesQuery([], 1000)],
    });

    expect(await findButton('subscription.extendNow')).toBeEnabled();
  });

  it('only shows the subscriptions the filter keeps', async () => {
    renderWithProviders(<SubscriptionListContainer filter={() => []} />, {
      mocks: [subscriptionsQuery([subscription]), invoicesQuery([])],
    });

    expect(
      await screen.findByRole('link', { name: t('subscription.subscribeNow') })
    ).toHaveAttribute('href', '/mitmachen');
    expect(
      screen.queryByRole('heading', { name: 'Jahresabo' })
    ).not.toBeInTheDocument();
  });

  it('links to the given subscribe page', async () => {
    renderWithProviders(<SubscriptionListContainer subscribeUrl="/abo" />, {
      mocks: [subscriptionsQuery([]), invoicesQuery([])],
    });

    expect(
      await screen.findByRole('link', { name: t('subscription.subscribeNow') })
    ).toHaveAttribute('href', '/abo');
  });

  it('shows why the subscriptions could not be loaded', async () => {
    renderWithProviders(<SubscriptionListContainer />, {
      mocks: [
        mockOperation(SubscriptionsDocument, {
          errors: [{ message: 'Not authenticated' }],
        }),
        invoicesQuery([]),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Not authenticated'
    );
  });
});
