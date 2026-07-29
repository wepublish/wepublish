import { PaymentState } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { Intent, PaymentProvider } from './payment-provider/payment-provider';

function fakeProvider(id: string): PaymentProvider {
  return {
    id,
    createIntent: jest.fn().mockResolvedValue({
      intentID: '999',
      intentSecret: 'secret',
      intentData: '{}',
      state: PaymentState.submitted,
    } as Intent),
  } as unknown as PaymentProvider;
}

describe('PaymentsService.createPaymentWithProvider', () => {
  const invoice = {
    id: 'invoice-1',
    subscriptionID: 'sub-1',
    currency: 'CHF',
    items: [],
  } as any;

  function setup(resolvedMethod: { id: string; paymentProviderID: string }) {
    const stripeProvider = fakeProvider('stripe');
    const payrexxProvider = fakeProvider('payrexx');

    const prisma = {
      paymentMethod: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...resolvedMethod, active: true }),
      },
      subscription: {
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'payment-1',
          ...data,
        })),
      },
      paymentProviderCustomer: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new PaymentsService(
      prisma as any,
      {
        paymentProviders: [stripeProvider, payrexxProvider],
      } as any
    );

    return { service, prisma, stripeProvider, payrexxProvider };
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
});
