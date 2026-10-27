import {
  Currency,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  PaymentPeriodicity,
  PaymentState,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { add } from 'date-fns';
import { PaymentMethodChangeService } from './payment-method-change.service';

const NOW = new Date('2026-10-21T10:00:00Z');

const memberPlan = {
  id: 'plan-1',
  availablePaymentMethods: [
    {
      paymentMethodIDs: ['pm-invoice', 'pm-card', 'pm-twint'],
      paymentPeriodicities: [PaymentPeriodicity.yearly],
      forceAutoRenewal: false,
    },
  ],
};

const paymentMethods: Record<string, any> = {
  'pm-invoice': {
    id: 'pm-invoice',
    slug: 'invoice',
    active: true,
    paymentProviderID: 'bexio',
  },
  'pm-card': {
    id: 'pm-card',
    slug: 'card',
    active: true,
    paymentProviderID: 'stripe',
  },
  'pm-twint': {
    id: 'pm-twint',
    slug: 'twint',
    active: true,
    paymentProviderID: 'payrexx',
  },
  'pm-legacy': {
    id: 'pm-legacy',
    slug: 'payrexx-subscription',
    active: true,
    paymentProviderID: 'payrexx-subscription',
  },
};

const provider = (
  id: string,
  {
    offSession = true,
    authorization = true,
    remote = false,
  }: { offSession?: boolean; authorization?: boolean; remote?: boolean } = {}
) => ({
  id,
  remoteManagedSubscription: remote,
  isOffSession: vi.fn().mockResolvedValue(offSession),
  supportsAuthorization: vi.fn().mockReturnValue(authorization),
  createAuthorizationIntent: vi.fn().mockResolvedValue({
    intentID: `${id}_intent`,
    intentSecret: `https://${id}.example.com/authorize`,
    state: 'processing',
    amount: 1,
    intentData: '{}',
  }),
  checkAuthorizationStatus: vi.fn(),
  releaseAuthorization: vi.fn().mockResolvedValue(undefined),
  saveCustomer: vi.fn().mockResolvedValue(undefined),
  checkIntentStatus: vi.fn(),
  updatePaymentWithIntentState: vi.fn(),
});

describe('PaymentMethodChangeService', () => {
  let service: PaymentMethodChangeService;
  let prisma: any;
  let payments: any;
  let memberContext: any;
  let settings: any;
  let invoicePaidNotifier: any;
  let authorizationNotifier: any;
  let providers: Record<string, ReturnType<typeof provider>>;
  let subscription: any;
  let changes: Record<string, any>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    subscription = {
      id: 'sub-1',
      userID: 'user-1',
      memberPlanID: 'plan-1',
      memberPlan,
      paymentMethodID: 'pm-invoice',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      autoRenew: true,
      currency: Currency.CHF,
      deactivation: null,
      user: { id: 'user-1', email: 'reader@example.com' },
    };

    changes = {};
    let nextId = 1;

    providers = {
      bexio: provider('bexio', { offSession: false, authorization: false }),
      stripe: provider('stripe'),
      payrexx: provider('payrexx'),
      'payrexx-subscription': provider('payrexx-subscription', {
        remote: true,
      }),
    };

    prisma = {
      subscription: {
        findUnique: vi.fn(async () => subscription),
        update: vi.fn(async ({ data }: any) => {
          Object.assign(subscription, data);
          return subscription;
        }),
      },
      paymentMethod: {
        findUnique: vi.fn(async ({ where }: any) => {
          const method = paymentMethods[where.id];
          return method && (where.active == null || method.active) ?
              method
            : null;
        }),
      },
      paymentProviderCustomer: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      settingPaymentProvider: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      invoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      payment: {
        findUnique: vi.fn(),
      },
      subscriptionPaymentMethodChange: {
        create: vi.fn(async ({ data }: any) => {
          const change = {
            id: `change-${nextId++}`,
            createdAt: NOW,
            paymentID: null,
            intentID: null,
            intentSecret: null,
            intentData: null,
            completedAt: null,
            amount: 0,
            ...data,
          };
          changes[change.id] = change;
          return change;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          Object.assign(changes[where.id], data);
          return changes[where.id];
        }),
        updateMany: vi.fn(async ({ where, data }: any) => {
          const matching = Object.values(changes).filter(
            change =>
              (!where.id || change.id === where.id) &&
              (!where.state || change.state === where.state)
          );
          matching.forEach(change => Object.assign(change, data));
          return { count: matching.length };
        }),
        findUnique: vi.fn(async ({ where }: any) => changes[where.id] ?? null),
        findFirst: vi.fn(async ({ where }: any) => {
          return (
            Object.values(changes).find(
              change =>
                (!where.state || change.state === where.state) &&
                (!where.kind || change.kind === where.kind) &&
                (!where.subscriptionID ||
                  change.subscriptionID === where.subscriptionID) &&
                (!where.payment?.invoiceID ||
                  where.payment.invoiceID === change.invoiceIDForTest)
            ) ?? null
          );
        }),
        findMany: vi.fn(async ({ where }: any) =>
          Object.values(changes).filter(
            change =>
              (!where.state || change.state === where.state) &&
              (!where.subscriptionID ||
                change.subscriptionID === where.subscriptionID) &&
              (!where.expiresAt || change.expiresAt <= where.expiresAt.lte)
          )
        ),
      },
      $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations)
      ),
    };

    payments = {
      getProviders: vi.fn(() => Object.values(providers)),
      findById: vi.fn((id: string) => providers[id]),
      createPaymentWithProvider: vi.fn().mockResolvedValue({
        id: 'payment-1',
        invoiceID: 'invoice-1',
        state: PaymentState.submitted,
        intentSecret: 'https://stripe.example.com/pay',
      }),
    };

    memberContext = {
      validateSubscriptionPaymentConfiguration: vi.fn(
        async (plan: any, autoRenew: boolean, periodicity: any, id: string) => {
          if (
            !plan.availablePaymentMethods.some((apm: any) =>
              apm.paymentMethodIDs.includes(id)
            )
          ) {
            throw new BadRequestException('Payment configuration not allowed');
          }
        }
      ),
    };

    settings = {
      settingByName: vi.fn().mockResolvedValue({ value: 14 }),
    };
    invoicePaidNotifier = { register: vi.fn(), notify: vi.fn() };
    authorizationNotifier = { register: vi.fn() };

    service = new PaymentMethodChangeService(
      prisma,
      payments,
      memberContext,
      settings,
      invoicePaidNotifier,
      authorizationNotifier
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const start = (paymentMethodId: string, userId = 'user-1') =>
    service.start(userId, {
      subscriptionId: 'sub-1',
      paymentMethodId,
      successURL: 'https://site.example.com/profile?changed=1',
      failureURL: 'https://site.example.com/profile?failed=1',
    });

  it('listens to paid invoices and authorizations', () => {
    service.onModuleInit();

    expect(invoicePaidNotifier.register).toHaveBeenCalledWith(service);
    expect(authorizationNotifier.register).toHaveBeenCalledWith(service);
  });

  describe('start', () => {
    describe('with an open invoice', () => {
      const invoice = {
        id: 'invoice-1',
        subscriptionID: 'sub-1',
        currency: Currency.CHF,
        items: [{ amount: 12000, quantity: 1 }],
      };

      beforeEach(() => {
        prisma.invoice.findFirst.mockResolvedValue(invoice);
      });

      it('pays the open invoice with the new payment method', async () => {
        const result = await start('pm-card');

        expect(payments.createPaymentWithProvider).toHaveBeenCalledWith({
          invoice,
          paymentMethodID: 'pm-card',
          saveCustomer: true,
          successURL: 'https://site.example.com/profile?changed=1',
          failureURL: 'https://site.example.com/profile?failed=1',
        });
        expect(result.intentSecret).toBe('https://stripe.example.com/pay');
        expect(result.paymentProviderID).toBe('stripe');
        expect(result.change).toEqual(
          expect.objectContaining({
            kind: PaymentMethodChangeKind.invoicePayment,
            state: PaymentMethodChangeState.pending,
            subscriptionID: 'sub-1',
            fromPaymentMethodID: 'pm-invoice',
            paymentMethodID: 'pm-card',
            paymentID: 'payment-1',
            currency: Currency.CHF,
            expiresAt: add(NOW, { days: 14 }),
          })
        );
      });

      it('keeps the current payment method until the invoice is paid', async () => {
        await start('pm-card');

        expect(subscription.paymentMethodID).toBe('pm-invoice');
        expect(prisma.subscription.update).not.toHaveBeenCalled();
      });

      it('also pays an open invoice when the new method needs no authorization', async () => {
        subscription.paymentMethodID = 'pm-card';

        const result = await start('pm-invoice');

        expect(payments.createPaymentWithProvider).toHaveBeenCalled();
        expect(result.change.kind).toBe(PaymentMethodChangeKind.invoicePayment);
      });

      it('marks the change failed when the payment cannot be created', async () => {
        payments.createPaymentWithProvider.mockRejectedValue(
          new Error('card_declined')
        );

        await expect(start('pm-card')).rejects.toThrow('card_declined');
        expect(Object.values(changes)[0].state).toBe(
          PaymentMethodChangeState.failed
        );
      });
    });

    describe('without an open invoice', () => {
      it('authorizes an off-session payment method without charging it', async () => {
        const result = await start('pm-card');

        expect(
          providers['stripe'].createAuthorizationIntent
        ).toHaveBeenCalledWith({
          changeID: 'change-1',
          currency: Currency.CHF,
          customerID: undefined,
          email: 'reader@example.com',
          successURL: 'https://site.example.com/profile?changed=1',
          failureURL: 'https://site.example.com/profile?failed=1',
        });
        expect(payments.createPaymentWithProvider).not.toHaveBeenCalled();
        expect(result.intentSecret).toBe(
          'https://stripe.example.com/authorize'
        );
        expect(result.change).toEqual(
          expect.objectContaining({
            kind: PaymentMethodChangeKind.authorization,
            state: PaymentMethodChangeState.pending,
            intentID: 'stripe_intent',
            amount: 1,
          })
        );
        expect(subscription.paymentMethodID).toBe('pm-invoice');
      });

      it('attaches the authorization to a customer the provider already knows', async () => {
        prisma.paymentProviderCustomer.findFirst.mockResolvedValue({
          customerID: 'cus_known',
        });

        await start('pm-card');

        expect(prisma.paymentProviderCustomer.findFirst).toHaveBeenCalledWith({
          where: { userId: 'user-1', paymentProviderID: 'stripe' },
        });
        expect(
          providers['stripe'].createAuthorizationIntent
        ).toHaveBeenCalledWith(
          expect.objectContaining({ customerID: 'cus_known' })
        );
      });

      it('lets readers re-authorize their current payment method, e.g. with a new card', async () => {
        subscription.paymentMethodID = 'pm-card';

        const result = await start('pm-card');

        expect(result.change.kind).toBe(PaymentMethodChangeKind.authorization);
      });

      it('switches straight away to a payment method that needs no authorization', async () => {
        subscription.paymentMethodID = 'pm-card';

        const result = await start('pm-invoice');

        expect(result.intentSecret).toBeUndefined();
        expect(result.change).toEqual(
          expect.objectContaining({
            kind: PaymentMethodChangeKind.immediate,
            state: PaymentMethodChangeState.completed,
            completedAt: NOW,
          })
        );
        expect(subscription.paymentMethodID).toBe('pm-invoice');
      });

      it('refuses an off-session payment method its provider cannot authorize', async () => {
        providers['stripe'].supportsAuthorization.mockReturnValue(false);

        await expect(start('pm-card')).rejects.toThrow(BadRequestException);
        expect(
          prisma.subscriptionPaymentMethodChange.create
        ).not.toHaveBeenCalled();
      });
    });

    it('replaces a pending change and releases its hold', async () => {
      await start('pm-twint');
      const first = changes['change-1'];

      await start('pm-card');

      expect(first.state).toBe(PaymentMethodChangeState.canceled);
      expect(providers['payrexx'].releaseAuthorization).toHaveBeenCalledWith({
        intentID: 'payrexx_intent',
      });
      expect(changes['change-2'].state).toBe(PaymentMethodChangeState.pending);
    });

    it('falls back to 14 days when the expiry setting is missing', async () => {
      settings.settingByName.mockRejectedValue(new Error('no setting'));

      const result = await start('pm-card');

      expect(result.change.expiresAt).toEqual(add(NOW, { days: 14 }));
    });

    it('uses the configured expiry', async () => {
      settings.settingByName.mockResolvedValue({ value: 3 });

      const result = await start('pm-card');

      expect(result.change.expiresAt).toEqual(add(NOW, { days: 3 }));
    });

    describe('refuses', () => {
      it('subscriptions of other users', async () => {
        await expect(start('pm-card', 'user-2')).rejects.toThrow(
          BadRequestException
        );
      });

      it('deactivated subscriptions', async () => {
        subscription.deactivation = { reason: 'userSelfDeactivated' };

        await expect(start('pm-card')).rejects.toThrow(BadRequestException);
      });

      it('payment methods the plan does not offer', async () => {
        memberPlan.availablePaymentMethods[0].paymentMethodIDs.pop();

        await expect(start('pm-twint')).rejects.toThrow(BadRequestException);

        memberPlan.availablePaymentMethods[0].paymentMethodIDs.push('pm-twint');
      });

      it('inactive payment methods', async () => {
        paymentMethods['pm-card'].active = false;

        await expect(start('pm-card')).rejects.toThrow(NotFoundException);

        paymentMethods['pm-card'].active = true;
      });

      it('payment methods of a retired payment provider', async () => {
        prisma.settingPaymentProvider.findMany.mockResolvedValue([
          { id: 'stripe' },
        ]);

        await expect(start('pm-card')).rejects.toThrow(BadRequestException);
      });

      it('switching to the payment method a subscription already has when nothing needs authorizing', async () => {
        await expect(start('pm-invoice')).rejects.toThrow(BadRequestException);
      });

      it('renewing a payment method that is not charged off session, even with an open invoice', async () => {
        prisma.invoice.findFirst.mockResolvedValue({
          id: 'invoice-1',
          currency: Currency.CHF,
          items: [],
        });

        await expect(start('pm-invoice')).rejects.toThrow(BadRequestException);
        expect(payments.createPaymentWithProvider).not.toHaveBeenCalled();
      });

      it('subscriptions a payment provider manages remotely', async () => {
        subscription.paymentMethodID = 'pm-legacy';

        await expect(start('pm-card')).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('canRenew', () => {
    it('is true for a payment method renewals are charged with automatically', async () => {
      expect(await service.canRenew('pm-card')).toBe(true);
    });

    it('is false for a payment method without automatic renewals', async () => {
      expect(await service.canRenew('pm-invoice')).toBe(false);
    });

    it('is false when the provider cannot authorize without a charge', async () => {
      providers['stripe'].supportsAuthorization.mockReturnValue(false);

      expect(await service.canRenew('pm-card')).toBe(false);
    });

    it('is false for a subscription a payment provider manages remotely', async () => {
      expect(await service.canRenew('pm-legacy')).toBe(false);
    });

    it('is false for an unknown payment method', async () => {
      expect(await service.canRenew('pm-unknown')).toBe(false);
    });
  });

  describe('completing', () => {
    it('switches once the open invoice was paid with the new payment method', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'invoice-1',
        currency: Currency.CHF,
        items: [],
      });
      await start('pm-card');
      changes['change-1'].invoiceIDForTest = 'invoice-1';
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        state: PaymentState.paid,
      });

      await service.onInvoicePaid('invoice-1');

      expect(subscription.paymentMethodID).toBe('pm-card');
      expect(changes['change-1']).toEqual(
        expect.objectContaining({
          state: PaymentMethodChangeState.completed,
          completedAt: NOW,
        })
      );
    });

    it('fails when the invoice got paid some other way', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'invoice-1',
        currency: Currency.CHF,
        items: [],
      });
      await start('pm-card');
      changes['change-1'].invoiceIDForTest = 'invoice-1';
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        state: PaymentState.submitted,
      });

      await service.onInvoicePaid('invoice-1');

      expect(subscription.paymentMethodID).toBe('pm-invoice');
      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.failed);
    });

    it('ignores paid invoices without a pending change', async () => {
      await service.onInvoicePaid('invoice-unrelated');

      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('stores the token, releases the hold and switches on authorization', async () => {
      await start('pm-twint');

      await service.onAuthorization('payrexx', {
        changeID: 'change-1',
        state: 'authorized',
        customerID: '4711',
      });

      expect(providers['payrexx'].saveCustomer).toHaveBeenCalledWith(
        'user-1',
        '4711'
      );
      expect(providers['payrexx'].releaseAuthorization).toHaveBeenCalledWith({
        intentID: 'payrexx_intent',
      });
      expect(subscription.paymentMethodID).toBe('pm-twint');
      expect(changes['change-1'].state).toBe(
        PaymentMethodChangeState.completed
      );
    });

    it('still switches when the hold cannot be released', async () => {
      await start('pm-twint');
      providers['payrexx'].releaseAuthorization.mockRejectedValue(
        new Error('not releasable')
      );

      await service.onAuthorization('payrexx', {
        changeID: 'change-1',
        state: 'authorized',
        customerID: '4711',
      });

      expect(subscription.paymentMethodID).toBe('pm-twint');
    });

    it('marks the change failed when the authorization fails', async () => {
      await start('pm-twint');

      await service.onAuthorization('payrexx', {
        changeID: 'change-1',
        state: 'failed',
      });

      expect(subscription.paymentMethodID).toBe('pm-invoice');
      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.failed);
      expect(providers['payrexx'].saveCustomer).not.toHaveBeenCalled();
    });

    it('keeps waiting while the authorization is processing', async () => {
      await start('pm-twint');

      await service.onAuthorization('payrexx', {
        changeID: 'change-1',
        state: 'processing',
      });

      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.pending);
    });

    it('keeps waiting for an authorization without a token', async () => {
      await start('pm-twint');

      await service.onAuthorization('payrexx', {
        changeID: 'change-1',
        state: 'authorized',
      });

      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.pending);
      expect(subscription.paymentMethodID).toBe('pm-invoice');
    });

    it('applies an authorization only once', async () => {
      await start('pm-twint');
      const authorized = {
        changeID: 'change-1',
        state: 'authorized' as const,
        customerID: '4711',
      };

      await service.onAuthorization('payrexx', authorized);
      await service.onAuthorization('payrexx', authorized);

      expect(providers['payrexx'].saveCustomer).toHaveBeenCalledTimes(1);
    });

    it('ignores an authorization reported by another provider', async () => {
      await start('pm-twint');

      await service.onAuthorization('stripe', {
        changeID: 'change-1',
        state: 'authorized',
        customerID: 'cus_1',
      });

      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.pending);
    });
  });

  describe('check', () => {
    it('asks the provider when the webhook has not arrived yet', async () => {
      await start('pm-twint');
      providers['payrexx'].checkAuthorizationStatus.mockResolvedValue({
        changeID: 'change-1',
        state: 'authorized',
        customerID: '4711',
      });

      const change = await service.check('user-1', 'change-1');

      expect(
        providers['payrexx'].checkAuthorizationStatus
      ).toHaveBeenCalledWith({
        intentID: 'payrexx_intent',
        changeID: 'change-1',
      });
      expect(change.state).toBe(PaymentMethodChangeState.completed);
    });

    it('checks the payment of the open invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'invoice-1',
        currency: Currency.CHF,
        items: [],
      });
      await start('pm-card');
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        invoiceID: 'invoice-1',
        intentID: 'pi_1',
        state: PaymentState.submitted,
      });
      const intentState = { paymentID: 'payment-1', state: PaymentState.paid };
      providers['stripe'].checkIntentStatus.mockResolvedValue(intentState);

      await service.check('user-1', 'change-1');

      expect(
        providers['stripe'].updatePaymentWithIntentState
      ).toHaveBeenCalledWith({ intentState });
      expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
    });

    describe('when the invoice was settled before the check', () => {
      // Another request (the invoice list's status check, the webhook) can
      // mark the payment paid first; the change must not wait for a
      // notification it may have missed.
      const startInvoicePayment = async (
        paymentState: PaymentState,
        paidAt: Date | null
      ) => {
        prisma.invoice.findFirst.mockResolvedValue({
          id: 'invoice-1',
          currency: Currency.CHF,
          items: [],
        });
        // not linked through `invoiceIDForTest`: the check settles the
        // change it holds instead of looking it up by invoice again
        await start('pm-card');
        prisma.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          invoiceID: 'invoice-1',
          intentID: 'pi_1',
          state: paymentState,
        });
        prisma.invoice.findUnique.mockResolvedValue({
          id: 'invoice-1',
          paidAt,
        });
      };

      it('completes a change whose payment is already paid', async () => {
        await startInvoicePayment(PaymentState.paid, NOW);

        const change = await service.check('user-1', 'change-1');

        expect(change.state).toBe(PaymentMethodChangeState.completed);
        expect(subscription.paymentMethodID).toBe('pm-card');
        expect(providers['stripe'].checkIntentStatus).not.toHaveBeenCalled();
      });

      it('fails the change when the invoice was paid another way', async () => {
        await startInvoicePayment(PaymentState.canceled, NOW);
        providers['stripe'].checkIntentStatus.mockResolvedValue(null);

        const change = await service.check('user-1', 'change-1');

        expect(change.state).toBe(PaymentMethodChangeState.failed);
        expect(subscription.paymentMethodID).toBe('pm-invoice');
      });

      it('keeps waiting while the invoice is open', async () => {
        await startInvoicePayment(PaymentState.processing, null);
        providers['stripe'].checkIntentStatus.mockResolvedValue(null);

        const change = await service.check('user-1', 'change-1');

        expect(change.state).toBe(PaymentMethodChangeState.pending);
        expect(subscription.paymentMethodID).toBe('pm-invoice');
      });
    });

    it('refuses changes of other users', async () => {
      await start('pm-twint');

      await expect(service.check('user-2', 'change-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('cancel', () => {
    it('cancels a pending change and releases its hold', async () => {
      await start('pm-twint');

      const change = await service.cancel('user-1', 'change-1');

      expect(change.state).toBe(PaymentMethodChangeState.canceled);
      expect(providers['payrexx'].releaseAuthorization).toHaveBeenCalled();
      expect(subscription.paymentMethodID).toBe('pm-invoice');
    });

    it('refuses changes of other users', async () => {
      await start('pm-twint');

      await expect(service.cancel('user-2', 'change-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('expirePending', () => {
    it('expires changes past their expiry and releases their holds', async () => {
      await start('pm-twint');

      const expired = await service.expirePending(add(NOW, { days: 15 }));

      expect(expired).toBe(1);
      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.expired);
      expect(providers['payrexx'].releaseAuthorization).toHaveBeenCalled();
      expect(subscription.paymentMethodID).toBe('pm-invoice');
    });

    it('keeps changes that have not expired yet', async () => {
      await start('pm-twint');

      expect(await service.expirePending(add(NOW, { days: 1 }))).toBe(0);
      expect(changes['change-1'].state).toBe(PaymentMethodChangeState.pending);
    });
  });
});
