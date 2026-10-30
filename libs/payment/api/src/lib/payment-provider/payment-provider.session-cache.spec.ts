import bodyParser from 'body-parser';
import { PaymentState, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { SESSION_CACHE_NAMESPACE } from '@wepublish/authentication/api';
import { IntentState } from './payment-provider';
import { MolliePaymentProvider } from './mollie-payment-provider';

describe('payment provider customers', () => {
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
  });

  afterEach(() => testing.close());

  const buildPrismaMock = () => ({
    payment: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'pay-1',
        invoiceID: 'inv-1',
        intentData: null,
        intentSecret: null,
        intentID: 'intent-1',
        paymentMethodID: 'pm-1',
      }),
      update: vi.fn().mockResolvedValue({ id: 'pay-1' }),
    },
    invoice: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'inv-1',
        subscriptionID: 'sub-1',
        canceledAt: null,
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    subscription: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'sub-1',
        userID: 'user-1',
        periods: [{ invoiceID: 'inv-1', endsAt: new Date('2027-01-01') }],
        deactivation: null,
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    subscriptionDeactivation: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'user-1', paymentProviderCustomers: [] }),
      update: vi.fn().mockResolvedValue({ id: 'user-1' }),
    },
  });

  it('clears cached sessions when it stores a new customer id, since sessions carry the customers', async () => {
    const prisma = buildPrismaMock();
    await testing.cache.setNs(
      'settings:paymentprovider',
      'mollie',
      { offSessionPayments: true },
      60
    );
    const reset = vi.spyOn(testing.resets, 'reset');
    const sessionsBefore = await testing.versions.current(
      SESSION_CACHE_NAMESPACE
    );
    const provider = new MolliePaymentProvider({
      id: 'mollie',
      incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
      prisma: prisma as unknown as PrismaClient,
      kv: testing.cache,
      resets: testing.resets,
    });

    await provider.updatePaymentWithIntentState({
      intentState: {
        paymentID: 'pay-1',
        state: PaymentState.paid,
        paymentData: '{}',
        customerID: 'cus-1',
      } as IntentState,
    });

    expect(prisma.user.update).toHaveBeenCalled();
    expect(reset).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
    await expect(
      testing.versions.current(SESSION_CACHE_NAMESPACE)
    ).resolves.not.toBe(sessionsBefore);
  });
});
