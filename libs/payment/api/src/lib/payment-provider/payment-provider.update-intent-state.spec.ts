import bodyParser from 'body-parser';
import {
  PaymentState,
  PrismaClient,
  SellableKind,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import {
  type NamespacedCache,
  type NamespaceResets,
} from '@wepublish/kv-ttl-cache/api';
import { SESSION_CACHE_NAMESPACE } from '@wepublish/authentication/api';
import { IntentState } from './payment-provider';
import { MolliePaymentProvider } from './mollie-payment-provider';

const startsAt = new Date('2026-01-01T00:00:00.000Z');
const endsAt = new Date('2027-01-01T00:00:00.000Z');

type MockOptions = {
  invoice?: Record<string, unknown> | null;
  periods?: Array<Record<string, unknown>>;
  deactivation?: Record<string, unknown> | null;
};

const buildPrismaMock = ({
  invoice = {
    id: 'inv-1',
    subscriptionID: 'sub-1',
    sellableKind: null,
    canceledAt: null,
  },
  periods = [{ invoiceID: 'inv-1', startsAt, endsAt }],
  deactivation = null,
}: MockOptions = {}) => ({
  payment: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'pay-1',
      invoiceID: 'inv-1',
      intentData: null,
      intentSecret: null,
      intentID: 'intent-1',
      paymentMethodID: 'pm-1',
    }),
    update: vi.fn().mockResolvedValue({ id: 'pay-1', invoiceID: 'inv-1' }),
  },
  invoice: {
    findUnique: vi.fn().mockResolvedValue(invoice),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  subscription: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'sub-1',
      userID: 'user-1',
      periods,
      deactivation,
    }),
    update: vi.fn().mockResolvedValue({}),
  },
  subscriptionDeactivation: {
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    upsert: vi.fn().mockResolvedValue({}),
  },
  user: {
    findUnique: vi
      .fn()
      .mockResolvedValue({ id: 'user-1', paymentProviderCustomers: [] }),
    update: vi.fn().mockResolvedValue({ id: 'user-1' }),
  },
});

const buildProvider = (prisma: ReturnType<typeof buildPrismaMock>) => {
  const kv = {
    getOrLoadNs: vi.fn().mockResolvedValue({ offSessionPayments: true }),
  };
  const resets = {
    reset: vi.fn().mockResolvedValue(undefined),
  };
  const provider = new MolliePaymentProvider({
    id: 'mollie',
    incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
    prisma: prisma as unknown as PrismaClient,
    kv: kv as unknown as NamespacedCache,
    resets: resets as unknown as NamespaceResets,
  });

  return { provider, resets };
};

const intent = (state: PaymentState, extra: Partial<IntentState> = {}) =>
  ({
    paymentID: 'pay-1',
    state,
    paymentData: '{}',
    ...extra,
  }) as IntentState;

describe('BasePaymentProvider.updatePaymentWithIntentState', () => {
  describe('subscription invoices', () => {
    it('marks a paid invoice as paid, extends the subscription and lifts an unpaid deactivation', async () => {
      const prisma = buildPrismaMock({
        deactivation: { reason: SubscriptionDeactivationReason.invoiceNotPaid },
      });
      const { provider } = buildProvider(prisma);

      const result = await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.paid),
      });

      expect(result).toEqual({ id: 'pay-1', invoiceID: 'inv-1' });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: {
          state: PaymentState.paid,
          paymentData: '{}',
          intentData: null,
          intentSecret: null,
          intentID: 'intent-1',
          invoiceID: 'inv-1',
          paymentMethodID: 'pm-1',
        },
      });
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { paidAt: expect.any(Date), canceledAt: null },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { paidUntil: endsAt },
      });
      expect(prisma.subscriptionDeactivation.deleteMany).toHaveBeenCalledWith({
        where: { subscriptionID: 'sub-1' },
      });
    });

    it('keeps a deactivation that has another reason on a paid invoice', async () => {
      const prisma = buildPrismaMock({
        deactivation: {
          reason: SubscriptionDeactivationReason.userSelfDeactivated,
        },
      });
      const { provider } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.paid),
      });

      expect(prisma.subscriptionDeactivation.deleteMany).not.toHaveBeenCalled();
    });

    it('cancels the invoice, cuts the subscription back and deactivates it on a chargeback', async () => {
      const prisma = buildPrismaMock();
      const { provider } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.chargeback),
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { paidAt: null, canceledAt: expect.any(Date) },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { paidUntil: new Date('2025-12-31T00:00:00.000Z') },
      });
      expect(prisma.subscriptionDeactivation.upsert).toHaveBeenCalledWith({
        where: { subscriptionID: 'sub-1' },
        create: {
          subscriptionID: 'sub-1',
          reason: SubscriptionDeactivationReason.chargeback,
          date: expect.any(Date),
        },
        update: {
          reason: SubscriptionDeactivationReason.chargeback,
          date: expect.any(Date),
        },
      });
    });

    it('touches neither invoice nor subscription for a pending state', async () => {
      const prisma = buildPrismaMock();
      const { provider } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.processing),
      });

      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('stores a returned customer id on the subscription owner and resets the session cache', async () => {
      const prisma = buildPrismaMock();
      const { provider, resets } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.paid, { customerID: 'cus-1' }),
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { paymentProviderCustomers: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          paymentProviderCustomers: {
            deleteMany: { paymentProviderID: 'mollie' },
            create: { paymentProviderID: 'mollie', customerID: 'cus-1' },
          },
        },
      });
      expect(resets.reset).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
    });

    it('throws when the payment does not exist', async () => {
      const prisma = buildPrismaMock();
      prisma.payment.findUnique.mockResolvedValue(null);
      const { provider } = buildProvider(prisma);

      await expect(
        provider.updatePaymentWithIntentState({
          intentState: intent(PaymentState.paid),
        })
      ).rejects.toThrow('Payment with ID pay-1 not found');
    });

    it('throws when the invoice has no period of the subscription', async () => {
      const prisma = buildPrismaMock({ periods: [] });
      const { provider } = buildProvider(prisma);

      await expect(
        provider.updatePaymentWithIntentState({
          intentState: intent(PaymentState.paid),
        })
      ).rejects.toThrow('Invoice with ID inv-1 has no period!');
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('sellable invoices', () => {
    const sellableInvoice = {
      id: 'inv-1',
      subscriptionID: null,
      sellableKind: SellableKind.giftCode,
      paidAt: null,
      canceledAt: null,
    };

    it('settles a paid sellable invoice without touching subscriptions, users or the session cache', async () => {
      const prisma = buildPrismaMock({
        invoice: sellableInvoice,
      });
      const { provider, resets } = buildProvider(prisma);

      const result = await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.paid, { customerID: 'cus-fresh' }),
      });

      expect(result).toEqual({ id: 'pay-1', invoiceID: 'inv-1' });
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-1', paidAt: null, canceledAt: null },
        data: { paidAt: expect.any(Date) },
      });
      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.subscriptionDeactivation.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(resets.reset).not.toHaveBeenCalled();
    });

    it('settles a chargeback on a sellable invoice', async () => {
      const prisma = buildPrismaMock({
        invoice: sellableInvoice,
      });
      const { provider } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.chargeback),
      });

      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-1', canceledAt: null },
        data: { paidAt: null, canceledAt: expect.any(Date) },
      });
      expect(prisma.subscriptionDeactivation.upsert).not.toHaveBeenCalled();
    });

    it('does not settle a subscription invoice as a sellable', async () => {
      const prisma = buildPrismaMock();
      const { provider } = buildProvider(prisma);

      await provider.updatePaymentWithIntentState({
        intentState: intent(PaymentState.paid),
      });

      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('invoices without a subscription', () => {
    it('throws for a subscription-less invoice that sells nothing', async () => {
      const prisma = buildPrismaMock({
        invoice: {
          id: 'inv-1',
          subscriptionID: null,
          sellableKind: null,
          canceledAt: null,
        },
      });
      const { provider } = buildProvider(prisma);

      await expect(
        provider.updatePaymentWithIntentState({
          intentState: intent(PaymentState.paid),
        })
      ).rejects.toThrow('Invoice with ID inv-1 does not exist');
    });

    it('throws for a missing invoice', async () => {
      const prisma = buildPrismaMock({ invoice: null });
      const { provider } = buildProvider(prisma);

      await expect(
        provider.updatePaymentWithIntentState({
          intentState: intent(PaymentState.paid),
        })
      ).rejects.toThrow('Invoice with ID inv-1 does not exist');
    });
  });
});
