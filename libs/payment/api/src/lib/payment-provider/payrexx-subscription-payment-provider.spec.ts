import bodyParser from 'body-parser';
import { PaymentState, PrismaClient } from '@prisma/client';
import {
  type NamespacedCache,
  type NamespaceResets,
} from '@wepublish/kv-ttl-cache/api';
import { PayrexxSubscriptionPaymentProvider } from './payrexx-subscription-payment-provider';

const startsAt = new Date('2026-01-01T00:00:00.000Z');
const endsAt = new Date('2027-01-01T00:00:00.000Z');

const buildPrisma = () => ({
  payment: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'pay-1',
      invoiceID: 'inv-1',
      intentData: null,
      intentSecret: null,
      intentID: null,
      paymentMethodID: 'pm-1',
    }),
    update: vi.fn().mockResolvedValue({ id: 'pay-1', invoiceID: 'inv-1' }),
    create: vi.fn(),
  },
  invoice: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'inv-1',
      subscriptionID: 'sub-1',
      sellableKind: null,
    }),
    update: vi.fn().mockResolvedValue({}),
    create: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'sub-1',
      userID: 'user-1',
      periods: [{ invoiceID: 'inv-1', startsAt, endsAt }],
      deactivation: null,
    }),
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
  },
  subscriptionDeactivation: { deleteMany: vi.fn() },
});

const buildProvider = (prisma: ReturnType<typeof buildPrisma>) =>
  new PayrexxSubscriptionPaymentProvider({
    id: 'payrexx-subscription',
    incomingRequestHandler: bodyParser.json(),
    prisma: prisma as unknown as PrismaClient,
    kv: {} as unknown as NamespacedCache,
    resets: { reset: vi.fn() } as unknown as NamespaceResets,
  });

describe('PayrexxSubscriptionPaymentProvider.updatePaymentWithIntentState', () => {
  it('handles a webhook transaction through the remote subscription', async () => {
    const prisma = buildPrisma();
    const provider = buildProvider(prisma);

    await provider.updatePaymentWithIntentState({
      intentState: {
        paymentID: 'pay-1',
        state: PaymentState.paid,
        paymentData: JSON.stringify({
          subscription: { id: 42, valid_until: '2027-01-01' },
        }),
      },
    });

    expect(prisma.subscription.findFirst).toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('settles a payment without Payrexx data like any other provider', async () => {
    const prisma = buildPrisma();
    const provider = buildProvider(prisma);

    const payment = await provider.updatePaymentWithIntentState({
      intentState: { paymentID: 'pay-1', state: PaymentState.paid },
    });

    expect(payment).toEqual({ id: 'pay-1', invoiceID: 'inv-1' });
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { paidAt: expect.any(Date), canceledAt: null },
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { paidUntil: endsAt },
    });
  });
});
