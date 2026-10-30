import {
  Currency,
  PaymentPeriodicity,
  PaymentState,
  ProductType,
  SellableKind,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SESSION_CACHE_NAMESPACE } from '@wepublish/authentication/api';
import { ErrorCode } from '@wepublish/errors';
import { PaymentsService } from './payments.service';
import { Intent, PaymentProvider } from './payment-provider/payment-provider';
import { SellableRegistry } from './sellable/sellable-registry.service';

function fakeProvider(
  id: string,
  state: PaymentState = PaymentState.submitted,
  { supportsStandaloneInvoices = false } = {}
): PaymentProvider {
  return {
    id,
    supportsStandaloneInvoices,
    createIntent: vi.fn().mockResolvedValue({
      intentID: '999',
      intentSecret: 'secret',
      intentData: '{}',
      state,
    } as Intent),
    checkIntentStatus: vi.fn().mockResolvedValue({
      paymentID: 'payment-1',
      state,
    }),
    updatePaymentWithIntentState: vi.fn().mockResolvedValue({
      id: 'payment-1',
      invoiceID: 'invoice-1',
    }),
  } as unknown as PaymentProvider;
}

describe('PaymentsService.createPaymentWithProvider', () => {
  const invoice = {
    id: 'invoice-1',
    subscriptionID: 'sub-1',
    currency: 'CHF',
    items: [
      { amount: 5000, quantity: 1 },
      { amount: 1000, quantity: 1 },
    ],
  } as any;

  function setup(
    resolvedMethod: { id: string; paymentProviderID: string },
    intentState: PaymentState = PaymentState.submitted
  ) {
    const stripeProvider = fakeProvider('stripe', intentState);
    const payrexxProvider = fakeProvider('payrexx', intentState);

    const prisma = {
      paymentMethod: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ ...resolvedMethod, active: true }),
      },
      subscription: {
        update: vi.fn().mockResolvedValue({
          id: 'sub-1',
          monthlyAmount: 500,
          currency: Currency.CHF,
          paymentPeriodicity: PaymentPeriodicity.yearly,
          memberPlan: {
            slug: 'member-plan',
            productType: ProductType.Subscription,
          },
        }),
      },
      payment: {
        create: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
        update: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
      },
      paymentProviderCustomer: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const invoicePaidNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };

    const service = new PaymentsService(
      prisma as any,
      {
        paymentProviders: [stripeProvider, payrexxProvider],
      } as any,
      invoicePaidNotifier as any,
      { reset: vi.fn() } as any,
      new SellableRegistry()
    );

    return {
      service,
      prisma,
      stripeProvider,
      payrexxProvider,
      invoicePaidNotifier,
    };
  }

  it('stores the payment under the migration TARGET method, matching the provider that charges it', async () => {
    const { service, prisma, payrexxProvider } = setup({
      id: 'payrexx-method',
      paymentProviderID: 'payrexx',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method', // source method
      migrateToTargetPaymentMethodID: 'payrexx-method', // target method
      invoice,
      saveCustomer: false,
    });

    // The intent is charged through the target (Payrexx) provider...
    expect(payrexxProvider.createIntent).toHaveBeenCalled();
    // ...so the stored payment must reference the target method, not the source.
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ paymentMethodID: 'payrexx-method' }),
    });
  });

  it('stores the payment under the given method when not migrating', async () => {
    const { service, prisma } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ paymentMethodID: 'stripe-method' }),
    });
  });

  it('adds the subscription information to the redirect urls', async () => {
    const { service, stripeProvider } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
      successURL: 'https://example.com/success?foo=bar',
      failureURL: 'https://example.com/fail',
    });

    expect(stripeProvider.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        successURL:
          'https://example.com/success?foo=bar&memberPlan=member-plan&productType=Subscription&monthlyAmount=5&currency=CHF&amount=60&periodicity=yearly&subscriptionId=sub-1',
        failureURL:
          'https://example.com/fail?memberPlan=member-plan&productType=Subscription&monthlyAmount=5&currency=CHF&amount=60&periodicity=yearly&subscriptionId=sub-1',
      })
    );
  });

  it('keeps redirect urls that cannot be parsed', async () => {
    const { service, stripeProvider } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
      successURL: '/success',
    });

    expect(stripeProvider.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        successURL: '/success',
        failureURL: undefined,
      })
    );
  });

  it('notifies that the invoice is paid when the intent comes back paid', async () => {
    const { service, invoicePaidNotifier } = setup(
      { id: 'stripe-method', paymentProviderID: 'stripe' },
      PaymentState.paid
    );

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
  });

  it('does not notify when the intent still needs the user', async () => {
    const { service, invoicePaidNotifier } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });

  it('migrates the subscription, confirms it and creates the payment in that order', async () => {
    const { service, prisma } = setup({
      id: 'payrexx-method',
      paymentProviderID: 'payrexx',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      migrateToTargetPaymentMethodID: 'payrexx-method',
      invoice,
      saveCustomer: true,
    });

    expect(prisma.paymentMethod.findUnique).toHaveBeenCalledWith({
      where: { id: 'payrexx-method', active: true },
    });
    expect(prisma.subscription.update).toHaveBeenNthCalledWith(1, {
      data: { paymentMethodID: 'payrexx-method' },
      where: { id: 'sub-1' },
    });
    expect(prisma.subscription.update).toHaveBeenNthCalledWith(2, {
      data: { confirmed: true },
      where: { id: 'sub-1' },
      include: { memberPlan: true },
    });
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        paymentMethodID: 'payrexx-method',
        invoiceID: 'invoice-1',
        state: PaymentState.created,
      },
    });
    expect(prisma.subscription.update.mock.invocationCallOrder[1]).toBeLessThan(
      prisma.payment.create.mock.invocationCallOrder[0]
    );
  });

  it('only confirms the subscription when not migrating', async () => {
    const { service, prisma } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      data: { confirmed: true },
      where: { id: 'sub-1' },
      include: { memberPlan: true },
    });
  });

  it('looks up the stored customer of the user and passes it to the intent', async () => {
    const { service, prisma, stripeProvider } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });
    prisma.paymentProviderCustomer.findFirst.mockResolvedValue({
      customerID: 'cus-1',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: true,
      userId: 'user-1',
    });

    expect(prisma.paymentProviderCustomer.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', paymentProviderID: 'stripe' },
    });
    expect(stripeProvider.createIntent).toHaveBeenCalledWith({
      paymentID: 'payment-1',
      invoice,
      currency: 'CHF',
      saveCustomer: true,
      successURL: undefined,
      failureURL: undefined,
      customerID: 'cus-1',
    });
  });

  it('does not look up a customer without a user', async () => {
    const { service, prisma, stripeProvider } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
    expect(stripeProvider.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({ customerID: undefined, saveCustomer: false })
    );
  });

  it('stores the intent on the payment', async () => {
    const { service, prisma } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    const payment = await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: {
        state: PaymentState.submitted,
        intentID: '999',
        intentData: '{}',
        intentSecret: 'secret',
        paymentData: undefined,
        paymentMethodID: 'stripe-method',
        invoiceID: 'invoice-1',
      },
    });
    expect(payment).toMatchObject({ id: 'payment-1', intentID: '999' });
  });

  it('settles an immediately paid intent before notifying', async () => {
    const { service, stripeProvider, invoicePaidNotifier } = setup(
      { id: 'stripe-method', paymentProviderID: 'stripe' },
      PaymentState.paid
    );

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: false,
    });

    expect(stripeProvider.checkIntentStatus).toHaveBeenCalledWith({
      intentID: '999',
      paymentID: 'payment-1',
    });
    expect(stripeProvider.updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState: { paymentID: 'payment-1', state: PaymentState.paid },
    });
    expect(
      vi.mocked(stripeProvider.updatePaymentWithIntentState).mock
        .invocationCallOrder[0]
    ).toBeLessThan(invoicePaidNotifier.notify.mock.invocationCallOrder[0]);
  });

  it('throws the intent error code after storing the payment', async () => {
    const { service, prisma, stripeProvider } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });
    vi.mocked(stripeProvider.createIntent).mockResolvedValue({
      intentID: '999',
      intentSecret: '',
      state: PaymentState.declined,
      errorCode: 'card_declined',
    });

    await expect(
      service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        invoice,
        saveCustomer: false,
      })
    ).rejects.toThrow('card_declined');
    expect(prisma.payment.update).toHaveBeenCalled();
  });

  it('charges a one cent invoice through the provider', async () => {
    const { service, prisma, stripeProvider, invoicePaidNotifier } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await service.createPaymentWithProvider({
      paymentMethodID: 'stripe-method',
      invoice: { ...invoice, items: [{ amount: 1, quantity: 1 }] },
      saveCustomer: false,
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ state: PaymentState.created }),
    });
    expect(stripeProvider.createIntent).toHaveBeenCalled();
    expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
  });

  describe('a zero total invoice', () => {
    const freeInvoice = {
      ...invoice,
      items: [
        { amount: 0, quantity: 1 },
        { amount: 0, quantity: 2 },
      ],
    };

    it('is paid without contacting the provider', async () => {
      const { service, prisma, stripeProvider, invoicePaidNotifier } = setup({
        id: 'stripe-method',
        paymentProviderID: 'stripe',
      });

      const payment = await service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        invoice: freeInvoice,
        saveCustomer: true,
        userId: 'user-1',
        successURL: 'https://example.com/success',
      });

      expect(stripeProvider.createIntent).not.toHaveBeenCalled();
      expect(stripeProvider.checkIntentStatus).not.toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          paymentMethodID: 'stripe-method',
          invoiceID: 'invoice-1',
          state: PaymentState.paid,
          intentSecret: '',
        },
      });
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(payment).toMatchObject({
        id: 'payment-1',
        state: PaymentState.paid,
      });
      expect(stripeProvider.updatePaymentWithIntentState).toHaveBeenCalledWith({
        intentState: { paymentID: 'payment-1', state: PaymentState.paid },
      });
      expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
      expect(
        vi.mocked(stripeProvider.updatePaymentWithIntentState).mock
          .invocationCallOrder[0]
      ).toBeLessThan(invoicePaidNotifier.notify.mock.invocationCallOrder[0]);
    });

    it('neither looks up nor saves a customer', async () => {
      const { service, prisma, stripeProvider } = setup({
        id: 'stripe-method',
        paymentProviderID: 'stripe',
      });

      await service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        invoice: freeInvoice,
        saveCustomer: true,
        userId: 'user-1',
      });

      expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
      expect(
        vi.mocked(stripeProvider.updatePaymentWithIntentState).mock.calls[0][0]
          .intentState.customerID
      ).toBeUndefined();
    });

    it('still migrates and confirms the subscription', async () => {
      const { service, prisma, payrexxProvider, stripeProvider } = setup({
        id: 'payrexx-method',
        paymentProviderID: 'payrexx',
      });

      await service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        migrateToTargetPaymentMethodID: 'payrexx-method',
        invoice: freeInvoice,
        saveCustomer: true,
      });

      expect(prisma.subscription.update).toHaveBeenNthCalledWith(1, {
        data: { paymentMethodID: 'payrexx-method' },
        where: { id: 'sub-1' },
      });
      expect(prisma.subscription.update).toHaveBeenNthCalledWith(2, {
        data: { confirmed: true },
        where: { id: 'sub-1' },
        include: { memberPlan: true },
      });
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ paymentMethodID: 'payrexx-method' }),
      });
      expect(payrexxProvider.updatePaymentWithIntentState).toHaveBeenCalled();
      expect(payrexxProvider.createIntent).not.toHaveBeenCalled();
      expect(
        stripeProvider.updatePaymentWithIntentState
      ).not.toHaveBeenCalled();
    });
  });

  it('refuses an invoice without a subscription', async () => {
    const { service, prisma } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });

    await expect(
      service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        invoice: { ...invoice, subscriptionID: null },
        saveCustomer: false,
      })
    ).rejects.toThrow('Subscription not found');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('refuses an inactive or unknown payment method', async () => {
    const { service, prisma } = setup({
      id: 'stripe-method',
      paymentProviderID: 'stripe',
    });
    prisma.paymentMethod.findUnique.mockResolvedValue(null);

    await expect(
      service.createPaymentWithProvider({
        paymentMethodID: 'stripe-method',
        invoice,
        saveCustomer: false,
      })
    ).rejects.toThrow('Payment method not found');
  });
});

describe('PaymentsService.createPaymentFromInvoice for subscriptions', () => {
  const invoice = {
    id: 'invoice-1',
    subscriptionID: 'sub-1',
    userID: null,
    paidAt: null,
    canceledAt: null,
    currency: 'CHF',
    sellableKind: null,
    items: [{ amount: 5000, quantity: 1 }],
  };

  function setup({
    storedInvoice = invoice as Record<string, unknown> | null,
    subscriptionUserID = 'user-1',
    blockingPayment = null as Record<string, unknown> | null,
  } = {}) {
    const prisma = {
      paymentMethod: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'stripe-method',
          paymentProviderID: 'stripe',
        }),
      },
      invoice: { findUnique: vi.fn().mockResolvedValue(storedInvoice) },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sub-1',
          userID: subscriptionUserID,
          memberPlan: { migrateToTargetPaymentMethodID: 'target-method' },
        }),
      },
      payment: { findFirst: vi.fn().mockResolvedValue(blockingPayment) },
    };

    const service = new PaymentsService(
      prisma as any,
      { paymentProviders: [] } as any,
      { notify: vi.fn() } as any,
      { reset: vi.fn() } as any,
      new SellableRegistry()
    );
    const createPaymentWithProvider = vi
      .spyOn(service, 'createPaymentWithProvider')
      .mockResolvedValue({ id: 'payment-1' } as any);

    return { service, prisma, createPaymentWithProvider };
  }

  const input = {
    invoiceID: 'invoice-1',
    paymentMethodID: 'stripe-method',
    successURL: 'https://example.com/success',
    failureURL: 'https://example.com/fail',
  };

  it('delegates to createPaymentWithProvider with the plan migration target', async () => {
    const { service, prisma, createPaymentWithProvider } = setup();

    await service.createPaymentFromInvoice('user-1', input);

    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      include: { items: true },
    });
    expect(createPaymentWithProvider).toHaveBeenCalledWith({
      paymentMethodID: 'stripe-method',
      invoice,
      saveCustomer: true,
      successURL: 'https://example.com/success',
      failureURL: 'https://example.com/fail',
      userId: 'user-1',
      migrateToTargetPaymentMethodID: 'target-method',
    });
  });

  it('requires exactly one payment method selector', async () => {
    const { service } = setup();

    await expect(
      service.createPaymentFromInvoice('user-1', { invoiceID: 'invoice-1' })
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createPaymentFromInvoice('user-1', {
        ...input,
        paymentMethodSlug: 'stripe',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a missing invoice', async () => {
    const { service } = setup({ storedInvoice: null });

    await expect(
      service.createPaymentFromInvoice('user-1', input)
    ).rejects.toThrow('Invoice not found invoice-1');
  });

  it('refuses a paid invoice', async () => {
    const { service } = setup({
      storedInvoice: { ...invoice, paidAt: new Date() },
    });

    await expect(
      service.createPaymentFromInvoice('user-1', input)
    ).rejects.toThrow('already paid or canceled');
  });

  it('refuses the subscription of another user', async () => {
    const { service, createPaymentWithProvider } = setup({
      subscriptionUserID: 'user-2',
    });

    await expect(
      service.createPaymentFromInvoice('user-1', input)
    ).rejects.toThrow('Invoice not found invoice-1');
    expect(createPaymentWithProvider).not.toHaveBeenCalled();
  });

  it('refuses while another payment is still running', async () => {
    const { service, prisma } = setup({ blockingPayment: { id: 'payment-0' } });

    await expect(
      service.createPaymentFromInvoice('user-1', input)
    ).rejects.toThrow(ErrorCode.PaymentAlreadyRunning);
    expect(prisma.payment.findFirst).toHaveBeenCalledWith({
      where: {
        invoiceID: 'invoice-1',
        state: {
          in: [
            PaymentState.created,
            PaymentState.submitted,
            PaymentState.processing,
          ],
        },
        createdAt: { gte: expect.any(Date) },
      },
    });
  });
});

describe('PaymentsService standalone invoice payments', () => {
  const standaloneInvoice = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'invoice-1',
      subscriptionID: null,
      userID: 'user-1',
      paidAt: null,
      canceledAt: null,
      currency: Currency.CHF,
      sellableKind: SellableKind.giftCode,
      items: [
        { amount: 2500, quantity: 2 },
        { amount: 1000, quantity: 1 },
      ],
      ...overrides,
    }) as any;

  const methods = {
    stripe: {
      id: 'stripe-method',
      paymentProviderID: 'stripe',
      active: true,
    },
    bexio: { id: 'bexio-method', paymentProviderID: 'bexio', active: true },
    retired: {
      id: 'retired-method',
      paymentProviderID: 'retired',
      active: true,
    },
    unknown: {
      id: 'unknown-method',
      paymentProviderID: 'unknown',
      active: true,
    },
  };

  function setup({
    intentState = PaymentState.submitted as PaymentState,
    storedInvoice = standaloneInvoice() as Record<string, unknown> | null,
    blockingPayment = null as Record<string, unknown> | null,
    registry = new SellableRegistry(),
  } = {}) {
    const stripeProvider = fakeProvider('stripe', intentState, {
      supportsStandaloneInvoices: true,
    });
    const bexioProvider = fakeProvider('bexio', intentState);
    const retiredProvider = fakeProvider('retired', intentState, {
      supportsStandaloneInvoices: true,
    });
    const allMethods = Object.values(methods);
    const findActive = async ({ where }: any) =>
      where.active === true ?
        (allMethods.find(({ id }) => id === where.id) ?? null)
      : null;

    const prisma = {
      paymentMethod: {
        findUnique: vi.fn().mockImplementation(findActive),
        findFirst: vi.fn().mockImplementation(findActive),
        findMany: vi
          .fn()
          .mockImplementation(async ({ where }: any) =>
            allMethods.filter(({ id }) => where.id.in.includes(id))
          ),
      },
      settingPaymentProvider: {
        findMany: vi.fn().mockResolvedValue([{ id: 'retired' }]),
      },
      invoice: { findUnique: vi.fn().mockResolvedValue(storedInvoice) },
      subscription: { update: vi.fn(), findUnique: vi.fn() },
      payment: {
        findFirst: vi.fn().mockResolvedValue(blockingPayment),
        create: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
        update: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
      },
      paymentProviderCustomer: {
        findFirst: vi.fn().mockResolvedValue({ customerID: 'cus-1' }),
      },
    };

    const invoicePaidNotifier = {
      notify: vi.fn().mockResolvedValue(undefined),
    };

    const service = new PaymentsService(
      prisma as any,
      {
        paymentProviders: [stripeProvider, bexioProvider, retiredProvider],
      } as any,
      invoicePaidNotifier as any,
      { reset: vi.fn() } as any,
      registry
    );

    return { service, prisma, stripeProvider, invoicePaidNotifier, registry };
  }

  describe('assertStandalonePaymentMethod', () => {
    it('returns the method and its provider', async () => {
      const { service, stripeProvider } = setup();

      await expect(
        service.assertStandalonePaymentMethod('stripe-method')
      ).resolves.toEqual({
        paymentMethod: methods.stripe,
        paymentProvider: stripeProvider,
      });
    });

    it.each([
      ['an inactive or missing method', 'missing-method'],
      ['a method without a configured provider', 'unknown-method'],
      ['a method of a retired provider', 'retired-method'],
      ['a provider without standalone invoices', 'bexio-method'],
    ])('refuses %s', async (_, id) => {
      const { service } = setup();

      await expect(service.assertStandalonePaymentMethod(id)).rejects.toThrow(
        new BadRequestException(
          'Payment method cannot be used for this purchase'
        )
      );
    });
  });

  describe('getStandalonePaymentMethods', () => {
    it('keeps active, non-retired methods of capable providers in id order', async () => {
      const { service, prisma } = setup();
      const secondStripe = { ...methods.stripe, id: 'stripe-2' };
      prisma.paymentMethod.findMany.mockResolvedValue([
        methods.bexio,
        secondStripe,
        methods.retired,
        methods.unknown,
        methods.stripe,
      ]);
      const ids = [
        'stripe-method',
        'bexio-method',
        'retired-method',
        'unknown-method',
        'stripe-2',
      ];

      await expect(service.getStandalonePaymentMethods(ids)).resolves.toEqual([
        methods.stripe,
        secondStripe,
      ]);
      expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, active: true },
      });
    });

    it('does not query without ids', async () => {
      const { service, prisma } = setup();

      await expect(service.getStandalonePaymentMethods([])).resolves.toEqual(
        []
      );
      expect(prisma.paymentMethod.findMany).not.toHaveBeenCalled();
    });
  });

  describe('createStandaloneInvoicePayment', () => {
    it.each([
      ['a subscription invoice', { subscriptionID: 'sub-1' }],
      ['an invoice without a buyer', { userID: null }],
      ['an invoice that sells nothing', { sellableKind: null }],
      ['a paid invoice', { paidAt: new Date() }],
      ['a canceled invoice', { canceledAt: new Date() }],
    ])('refuses %s', async (_, overrides) => {
      const { service, prisma } = setup();

      await expect(
        service.createStandaloneInvoicePayment({
          invoice: standaloneInvoice(overrides),
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it.each(['missing-method', 'retired-method', 'bexio-method'])(
      'refuses the payment method %s',
      async paymentMethodID => {
        const { service, prisma } = setup();

        await expect(
          service.createStandaloneInvoicePayment({
            invoice: standaloneInvoice(),
            paymentMethodID,
          })
        ).rejects.toThrow('Payment method cannot be used for this purchase');
        expect(prisma.payment.create).not.toHaveBeenCalled();
      }
    );

    it('refuses while another payment is still running', async () => {
      const { service, prisma } = setup({
        blockingPayment: { id: 'payment-0' },
      });

      await expect(
        service.createStandaloneInvoicePayment({
          invoice: standaloneInvoice(),
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow(ErrorCode.PaymentAlreadyRunning);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('never uses a stored customer and never saves one', async () => {
      const { service, prisma, stripeProvider } = setup();
      const invoice = standaloneInvoice();

      await service.createStandaloneInvoicePayment({
        invoice,
        paymentMethodID: 'stripe-method',
      });

      expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          paymentMethodID: 'stripe-method',
          invoiceID: 'invoice-1',
          state: PaymentState.created,
        },
      });
      expect(stripeProvider.createIntent).toHaveBeenCalledWith({
        paymentID: 'payment-1',
        invoice,
        currency: Currency.CHF,
        saveCustomer: false,
        customerID: undefined,
        successURL: undefined,
        failureURL: undefined,
      });
    });

    it('adds the invoice information to the redirect urls', async () => {
      const { service, stripeProvider } = setup();

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
        successURL: 'https://example.com/success?foo=bar',
        failureURL: 'https://example.com/fail',
      });

      expect(stripeProvider.createIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          successURL:
            'https://example.com/success?foo=bar&invoiceId=invoice-1&amount=60&currency=CHF&sellableKind=giftCode',
          failureURL:
            'https://example.com/fail?invoiceId=invoice-1&amount=60&currency=CHF&sellableKind=giftCode',
        })
      );
    });

    it('keeps redirect urls that cannot be parsed', async () => {
      const { service, stripeProvider } = setup();

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
        successURL: '/success',
      });

      expect(stripeProvider.createIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          successURL: '/success',
          failureURL: undefined,
        })
      );
    });

    it('settles an immediately paid intent and then notifies', async () => {
      const { service, stripeProvider, invoicePaidNotifier } = setup({
        intentState: PaymentState.paid,
      });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(stripeProvider.updatePaymentWithIntentState).toHaveBeenCalledWith({
        intentState: { paymentID: 'payment-1', state: PaymentState.paid },
      });
      expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
      expect(
        vi.mocked(stripeProvider.updatePaymentWithIntentState).mock
          .invocationCallOrder[0]
      ).toBeLessThan(invoicePaidNotifier.notify.mock.invocationCallOrder[0]);
    });

    it('charges a one cent sellable invoice through the provider', async () => {
      const { service, stripeProvider, invoicePaidNotifier } = setup();

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice({ items: [{ amount: 1, quantity: 1 }] }),
        paymentMethodID: 'stripe-method',
      });

      expect(stripeProvider.createIntent).toHaveBeenCalled();
      expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
    });

    describe('a zero total', () => {
      const freeInvoice = () =>
        standaloneInvoice({ items: [{ amount: 0, quantity: 1 }] });

      it('is paid without contacting the provider', async () => {
        const { service, prisma, stripeProvider, invoicePaidNotifier } =
          setup();

        const payment = await service.createStandaloneInvoicePayment({
          invoice: freeInvoice(),
          paymentMethodID: 'stripe-method',
          successURL: 'https://example.com/success',
        });

        expect(stripeProvider.createIntent).not.toHaveBeenCalled();
        expect(stripeProvider.checkIntentStatus).not.toHaveBeenCalled();
        expect(prisma.payment.create).toHaveBeenCalledWith({
          data: {
            paymentMethodID: 'stripe-method',
            invoiceID: 'invoice-1',
            state: PaymentState.paid,
            intentSecret: '',
          },
        });
        expect(payment).toMatchObject({
          id: 'payment-1',
          state: PaymentState.paid,
        });
        expect(
          stripeProvider.updatePaymentWithIntentState
        ).toHaveBeenCalledWith({
          intentState: { paymentID: 'payment-1', state: PaymentState.paid },
        });
        expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
        expect(
          vi.mocked(stripeProvider.updatePaymentWithIntentState).mock
            .invocationCallOrder[0]
        ).toBeLessThan(invoicePaidNotifier.notify.mock.invocationCallOrder[0]);
        expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
      });

      it.each(['missing-method', 'retired-method', 'bexio-method'])(
        'still refuses the payment method %s',
        async paymentMethodID => {
          const { service, prisma, invoicePaidNotifier } = setup();

          await expect(
            service.createStandaloneInvoicePayment({
              invoice: freeInvoice(),
              paymentMethodID,
            })
          ).rejects.toThrow('Payment method cannot be used for this purchase');
          expect(prisma.payment.create).not.toHaveBeenCalled();
          expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
        }
      );

      it('still refuses a method the sellable handler does not allow', async () => {
        const registry = new SellableRegistry();
        registry.register({
          kind: SellableKind.giftCode,
          fulfil: vi.fn(),
          revoke: vi.fn(),
          allowedPaymentMethodIds: vi.fn().mockResolvedValue(['other-method']),
        });
        const { service, prisma } = setup({ registry });

        await expect(
          service.createStandaloneInvoicePayment({
            invoice: freeInvoice(),
            paymentMethodID: 'stripe-method',
          })
        ).rejects.toThrow('Payment method cannot be used for this purchase');
        expect(prisma.payment.create).not.toHaveBeenCalled();
      });

      it('still refuses a paid invoice', async () => {
        const { service, prisma } = setup();

        await expect(
          service.createStandaloneInvoicePayment({
            invoice: standaloneInvoice({
              items: [{ amount: 0, quantity: 1 }],
              paidAt: new Date(),
            }),
            paymentMethodID: 'stripe-method',
          })
        ).rejects.toThrow(BadRequestException);
        expect(prisma.payment.create).not.toHaveBeenCalled();
      });

      it('is paid when the buyer pays an open order through createPaymentFromInvoice', async () => {
        const { service, stripeProvider, invoicePaidNotifier } = setup({
          storedInvoice: freeInvoice(),
        });

        const payment = await service.createPaymentFromInvoice('user-1', {
          invoiceID: 'invoice-1',
          paymentMethodID: 'stripe-method',
        });

        expect(payment).toMatchObject({ state: PaymentState.paid });
        expect(stripeProvider.createIntent).not.toHaveBeenCalled();
        expect(invoicePaidNotifier.notify).toHaveBeenCalledWith('invoice-1');
      });
    });

    it('does not notify while the intent waits for the buyer', async () => {
      const { service, invoicePaidNotifier } = setup();

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(invoicePaidNotifier.notify).not.toHaveBeenCalled();
    });
  });

  describe('payment methods allowed by the sellable handlers', () => {
    const handlerAllowing = (
      kind: SellableKind,
      allowed: string[] | undefined
    ) => ({
      kind,
      fulfil: vi.fn(),
      revoke: vi.fn(),
      allowedPaymentMethodIds: vi.fn().mockResolvedValue(allowed),
    });

    const registryWith = (
      ...handlers: ReturnType<typeof handlerAllowing>[]
    ) => {
      const registry = new SellableRegistry();
      handlers.forEach(handler => registry.register(handler));

      return registry;
    };

    it('asks only the handler of the invoice kind', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, ['stripe-method']);
      const registry = registryWith(handler);
      const get = vi.spyOn(registry, 'get');
      const { service } = setup({ registry });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(get).toHaveBeenCalledWith(SellableKind.giftCode);
      expect(new Set(get.mock.calls.flat())).toEqual(
        new Set([SellableKind.giftCode])
      );
    });

    it('refuses a method the handler of a line does not allow', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, ['other-method']);
      const { service, prisma } = setup({ registry: registryWith(handler) });
      const invoice = standaloneInvoice();

      await expect(
        service.createStandaloneInvoicePayment({
          invoice,
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow(
        new BadRequestException(
          'Payment method cannot be used for this purchase'
        )
      );
      expect(handler.allowedPaymentMethodIds).toHaveBeenCalledWith(
        invoice.items[0],
        invoice
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('accepts a method every line allows', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, [
        'other-method',
        'stripe-method',
      ]);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(handler.allowedPaymentMethodIds).toHaveBeenCalledTimes(2);
      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it('refuses when only one of the lines disallows the method', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, ['stripe-method']);
      handler.allowedPaymentMethodIds
        .mockResolvedValueOnce(['stripe-method'])
        .mockResolvedValueOnce([]);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await expect(
        service.createStandaloneInvoicePayment({
          invoice: standaloneInvoice(),
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow('Payment method cannot be used for this purchase');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('does not restrict when the handler has no opinion', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, undefined);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it('does not restrict handlers without the hook', async () => {
      const registry = new SellableRegistry();
      registry.register({
        kind: SellableKind.giftCode,
        fulfil: vi.fn(),
        revoke: vi.fn(),
      });
      const { service, prisma } = setup({ registry });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it('enforces the restriction when the buyer pays through createPaymentFromInvoice', async () => {
      const handler = handlerAllowing(SellableKind.giftCode, ['other-method']);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await expect(
        service.createPaymentFromInvoice('user-1', {
          invoiceID: 'invoice-1',
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow('Payment method cannot be used for this purchase');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('sellables that are switched off', () => {
    const handlerAvailable = (available: boolean) => ({
      kind: SellableKind.giftCode,
      fulfil: vi.fn(),
      revoke: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(available),
    });

    const registryWith = (handler: ReturnType<typeof handlerAvailable>) => {
      const registry = new SellableRegistry();
      registry.register(handler);

      return registry;
    };

    it('refuses to start a payment when a line is not available', async () => {
      const handler = handlerAvailable(false);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await expect(
        service.createStandaloneInvoicePayment({
          invoice: standaloneInvoice(),
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow('This purchase is currently not available');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('refuses the buyer paying an open order through createPaymentFromInvoice', async () => {
      const handler = handlerAvailable(false);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await expect(
        service.createPaymentFromInvoice('user-1', {
          invoiceID: 'invoice-1',
          paymentMethodID: 'stripe-method',
        })
      ).rejects.toThrow('This purchase is currently not available');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('starts the payment when every line is available', async () => {
      const handler = handlerAvailable(true);
      const { service, prisma } = setup({ registry: registryWith(handler) });

      await service.createStandaloneInvoicePayment({
        invoice: standaloneInvoice(),
        paymentMethodID: 'stripe-method',
      });

      expect(handler.isAvailable).toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
    });
  });

  describe('createPaymentFromInvoice for a buyer', () => {
    const input = { invoiceID: 'invoice-1', paymentMethodID: 'stripe-method' };

    it('pays a sellable invoice of the buyer without a stored customer', async () => {
      const { service, prisma, stripeProvider } = setup();

      await service.createPaymentFromInvoice('user-1', input);

      expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
      expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
      expect(stripeProvider.createIntent).toHaveBeenCalledWith(
        expect.objectContaining({ saveCustomer: false, customerID: undefined })
      );
    });

    it('refuses the sellable invoice of another user', async () => {
      const { service, prisma } = setup();

      await expect(
        service.createPaymentFromInvoice('user-2', input)
      ).rejects.toThrow('Invoice not found invoice-1');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('refuses a subscription-less invoice that sells nothing', async () => {
      const { service, prisma } = setup({
        storedInvoice: standaloneInvoice({ sellableKind: null }),
      });

      await expect(
        service.createPaymentFromInvoice('user-1', input)
      ).rejects.toThrow('Invoice not found invoice-1');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });
});

// Stores the customer (for bexio: the contact id) renewals of a user are matched
// with, for many users at once — e.g. the bexio contacts of imported readers.
describe('PaymentsService.setPaymentProviderCustomers', () => {
  function setup(knownUserIds = ['user-1', 'user-2']) {
    const prisma = {
      user: {
        findMany: vi.fn(async () => knownUserIds.map(id => ({ id }))),
        update: vi.fn(async ({ where }: { where: { id: string } }) => ({
          id: where.id,
        })),
      },
      $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations)
      ),
    };
    const resets = { reset: vi.fn().mockResolvedValue(undefined) };
    const service = new PaymentsService(
      prisma as any,
      { paymentProviders: [fakeProvider('bexio')] } as any,
      { notify: vi.fn() } as any,
      resets as any,
      new SellableRegistry()
    );

    return { service, prisma, resets };
  }

  const customers = [
    { userId: 'user-1', customerId: '542' },
    { userId: 'user-2', customerId: '823' },
  ];

  it("replaces each user's customer of this provider", async () => {
    const { service, prisma } = setup();

    await expect(
      service.setPaymentProviderCustomers({
        paymentProviderId: 'bexio',
        customers,
      })
    ).resolves.toBe(2);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        paymentProviderCustomers: {
          deleteMany: { paymentProviderID: 'bexio' },
          create: { paymentProviderID: 'bexio', customerID: '542' },
        },
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('skips users that do not exist and counts only the updated ones', async () => {
    const { service, prisma } = setup(['user-2']);

    await expect(
      service.setPaymentProviderCustomers({
        paymentProviderId: 'bexio',
        customers,
      })
    ).resolves.toBe(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  // sessions carry the customers
  it('clears the cached sessions once per call', async () => {
    const { service, resets } = setup();

    await service.setPaymentProviderCustomers({
      paymentProviderId: 'bexio',
      customers,
    });

    expect(resets.reset).toHaveBeenCalledTimes(1);
    expect(resets.reset).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
  });

  it('refuses an unknown payment provider', async () => {
    const { service, prisma } = setup();

    await expect(
      service.setPaymentProviderCustomers({
        paymentProviderId: 'unknown',
        customers,
      })
    ).rejects.toThrow(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it.each([
    ['no customers', []],
    [
      'more than 500 customers',
      Array.from({ length: 501 }, (_, i) => ({
        userId: `user-${i}`,
        customerId: `${i}`,
      })),
    ],
    [
      'the same user twice',
      [
        { userId: 'user-1', customerId: '542' },
        { userId: 'user-1', customerId: '543' },
      ],
    ],
    ['an empty customer id', [{ userId: 'user-1', customerId: ' ' }]],
  ])('refuses %s', async (_, input) => {
    const { service, prisma } = setup();

    await expect(
      service.setPaymentProviderCustomers({
        paymentProviderId: 'bexio',
        customers: input,
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
