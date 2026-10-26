import {
  Currency,
  PaymentPeriodicity,
  PaymentState,
  ProductType,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SESSION_CACHE_NAMESPACE } from '@wepublish/authentication/api';
import { PaymentsService } from './payments.service';
import { Intent, PaymentProvider } from './payment-provider/payment-provider';

function fakeProvider(
  id: string,
  state: PaymentState = PaymentState.submitted
): PaymentProvider {
  return {
    id,
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
      { resetNamespace: vi.fn() } as any
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
    const kv = { resetNamespace: vi.fn().mockResolvedValue(undefined) };
    const service = new PaymentsService(
      prisma as any,
      { paymentProviders: [fakeProvider('bexio')] } as any,
      { notify: vi.fn() } as any,
      kv as any
    );

    return { service, prisma, kv };
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
    const { service, kv } = setup();

    await service.setPaymentProviderCustomers({
      paymentProviderId: 'bexio',
      customers,
    });

    expect(kv.resetNamespace).toHaveBeenCalledTimes(1);
    expect(kv.resetNamespace).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
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
