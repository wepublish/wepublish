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
  mockSubscriptionDeactivation,
  mockSubscriptionPaymentMethodChange,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  CancelSubscriptionDocument,
  CancelSubscriptionPaymentMethodChangeDocument,
  ChangeSubscriptionPaymentMethodDocument,
  CheckInvoiceStatusDocument,
  CheckSubscriptionPaymentMethodChangeDocument,
  ExtendSubscriptionDocument,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  FullSubscriptionPaymentMethodChangeFragment,
  InvoicesDocument,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  PaymentPeriodicity,
  ProductType,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionDeactivationReason,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { ReactNode, useEffect } from 'react';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { SubscriptionListContainer } from './subscription-list-container';

const stripe = vi.hoisted(() => ({
  confirmSetup: vi.fn(),
  confirmPayment: vi.fn(),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => children,
  PaymentElement: ({ onReady }: { onReady: () => void }) => {
    useEffect(onReady, [onReady]);
    return null;
  },
  useStripe: () => stripe,
  useElements: () => ({}),
}));

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

  describe('changing the payment method', () => {
    const invoicePaymentMethod = mockPaymentMethod({
      id: 'invoice',
      name: 'Rechnung',
      slug: 'invoice',
      paymentProviderID: 'bexio',
    });
    const onlinePaymentMethod = mockPaymentMethod({
      id: 'online',
      name: 'Online',
      slug: 'online',
      paymentProviderID: 'payrexx',
    });

    const changeable = mockSubscription({
      id: 'subscription',
      paymentPeriodicity: PaymentPeriodicity.Yearly,
      paymentMethod: invoicePaymentMethod,
      memberPlan: mockMemberPlan({
        name: 'Jahresabo',
        availablePaymentMethods: [
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Yearly],
            paymentMethods: [invoicePaymentMethod, onlinePaymentMethod],
          }),
        ],
      }),
    });
    const changed = { ...changeable, paymentMethod: onlinePaymentMethod };

    const change = (
      overrides: Partial<FullSubscriptionPaymentMethodChangeFragment> = {}
    ) =>
      mockSubscriptionPaymentMethodChange({
        id: 'change-1',
        paymentMethod: onlinePaymentMethod,
        ...overrides,
      });
    const pending = { ...changeable, pendingPaymentMethodChange: change() };

    const changeMutation = (
      started: {
        intentSecret: string | null;
        paymentProviderID: string;
      },
      changeOverrides: Partial<FullSubscriptionPaymentMethodChangeFragment> = {}
    ) =>
      mockOperation(ChangeSubscriptionPaymentMethodDocument, {
        variables: {
          subscriptionId: 'subscription',
          paymentMethodId: 'online',
          successURL: window.location.href,
          failureURL: window.location.href,
        },
        data: {
          __typename: 'Mutation',
          changeSubscriptionPaymentMethod: {
            __typename: 'StartedSubscriptionPaymentMethodChange',
            change: change(changeOverrides),
            ...started,
          },
        },
      });

    const checkMutation = (state: PaymentMethodChangeState) =>
      mockOperation(CheckSubscriptionPaymentMethodChangeDocument, {
        variables: { id: 'change-1' },
        data: {
          __typename: 'Mutation',
          checkSubscriptionPaymentMethodChange: change({ state }),
        },
      });

    const paymentMethodLine = (paymentMethod: string) =>
      t('subscription.paymentMethod', { paymentMethod });

    const startChange = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await findButton('subscription.changePaymentMethod'));
      await user.click(button('subscription.changePaymentMethodSubmit'));
    };

    afterEach(() => {
      vi.restoreAllMocks();
      stripe.confirmSetup.mockReset();
    });

    it('shows the new payment method once a change needing no confirmation is done', async () => {
      const user = userEvent.setup();

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([changeable]),
          invoicesQuery([]),
          changeMutation(
            { intentSecret: null, paymentProviderID: 'bexio' },
            {
              kind: PaymentMethodChangeKind.Immediate,
              state: PaymentMethodChangeState.Completed,
            }
          ),
          subscriptionsQuery([changed]),
          invoicesQuery([]),
        ],
      });

      expect(
        await screen.findByText(paymentMethodLine('Rechnung'))
      ).toBeInTheDocument();

      await startChange(user);

      expect(
        await screen.findByText(paymentMethodLine('Online'))
      ).toBeInTheDocument();
    });

    it('sends the reader to the checkout of a hosted provider and back to this page', async () => {
      const user = userEvent.setup();
      const location = { href: 'https://site.example.com/profile' };
      vi.spyOn(window, 'location', 'get').mockReturnValue(
        location as unknown as Location
      );

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([changeable]),
          invoicesQuery([]),
          mockOperation(ChangeSubscriptionPaymentMethodDocument, {
            variables: {
              subscriptionId: 'subscription',
              paymentMethodId: 'online',
              successURL: 'https://site.example.com/profile',
              failureURL: 'https://site.example.com/profile',
            },
            data: {
              __typename: 'Mutation',
              changeSubscriptionPaymentMethod: {
                __typename: 'StartedSubscriptionPaymentMethodChange',
                change: change(),
                intentSecret: 'https://payrexx.example.com/checkout',
                paymentProviderID: 'payrexx',
              },
            },
          }),
        ],
      });

      await startChange(user);

      await waitFor(() =>
        expect(location.href).toBe('https://payrexx.example.com/checkout')
      );
    });

    it('lets Stripe confirm the payment method without a charge and then asks for the outcome', async () => {
      const user = userEvent.setup();
      stripe.confirmSetup.mockResolvedValue({});

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([changeable]),
          invoicesQuery([]),
          changeMutation({
            intentSecret: 'seti_secret',
            paymentProviderID: 'stripe',
          }),
          checkMutation(PaymentMethodChangeState.Completed),
          subscriptionsQuery([changed]),
          invoicesQuery([]),
        ],
      });

      await startChange(user);
      await user.click(await findButton('user.authorize'));

      expect(stripe.confirmSetup).toHaveBeenCalled();
      expect(
        await screen.findByText(paymentMethodLine('Online'))
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: t('user.authorize') })
      ).not.toBeInTheDocument();
    });

    it('closes the Stripe dialog without asking for the outcome when the reader aborts', async () => {
      const user = userEvent.setup();

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([changeable]),
          invoicesQuery([]),
          changeMutation({
            intentSecret: 'seti_secret',
            paymentProviderID: 'stripe',
          }),
        ],
      });

      await startChange(user);
      await findButton('user.authorize');

      const cancelButtons = screen.getAllByRole('button', {
        name: t('user.cancel'),
      });
      await user.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: t('user.authorize') })
        ).not.toBeInTheDocument()
      );
      expect(stripe.confirmSetup).not.toHaveBeenCalled();
      expect(
        screen.getByText(paymentMethodLine('Rechnung'))
      ).toBeInTheDocument();
    });

    it('asks the provider about a pending change when the reader comes back', async () => {
      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([pending]),
          invoicesQuery([]),
          checkMutation(PaymentMethodChangeState.Completed),
          subscriptionsQuery([changed]),
          invoicesQuery([]),
        ],
      });

      expect(
        await screen.findByText(paymentMethodLine('Online'))
      ).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('keeps showing a change the provider still reports as pending', async () => {
      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([pending]),
          invoicesQuery([]),
          checkMutation(PaymentMethodChangeState.Pending),
        ],
      });

      expect(
        await findButton('subscription.paymentMethodChangeCancel')
      ).toBeInTheDocument();
      expect(
        screen.getByText(paymentMethodLine('Rechnung'))
      ).toBeInTheDocument();
    });

    it('keeps the current payment method when the reader cancels the change', async () => {
      const user = userEvent.setup();

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [
          subscriptionsQuery([pending]),
          invoicesQuery([]),
          checkMutation(PaymentMethodChangeState.Pending),
          mockOperation(CancelSubscriptionPaymentMethodChangeDocument, {
            variables: { id: 'change-1' },
            data: {
              __typename: 'Mutation',
              cancelSubscriptionPaymentMethodChange: change({
                state: PaymentMethodChangeState.Canceled,
              }),
            },
          }),
          subscriptionsQuery([changeable]),
          invoicesQuery([]),
        ],
      });

      await user.click(
        await findButton('subscription.paymentMethodChangeCancel')
      );

      expect(
        await findButton('subscription.changePaymentMethod')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: t('subscription.paymentMethodChangeCancel'),
        })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(paymentMethodLine('Rechnung'))
      ).toBeInTheDocument();
    });

    it('explains that the open invoice of the subscription is paid with the new payment method', async () => {
      const user = userEvent.setup();
      const unpaid = mockInvoice({
        id: 'unpaid',
        paidAt: null,
        total: 12000,
        subscription: changeable,
      });

      renderWithProviders(<SubscriptionListContainer />, {
        mocks: [subscriptionsQuery([changeable]), invoicesQuery([unpaid])],
      });

      await user.click(await findButton('subscription.changePaymentMethod'));

      expect(
        screen.getByText(
          t('subscription.changePaymentMethodOpenInvoice', {
            amount: 'CHF 120.-',
            type,
          })
        )
      ).toBeInTheDocument();
    });
  });
});
