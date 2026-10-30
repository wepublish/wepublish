import { BadRequestException } from '@nestjs/common';
import bodyParser from 'body-parser';
import {
  Currency,
  PaymentPeriodicity,
  PaymentState,
  PrismaClient,
  ProductType,
  SellableKind,
} from '@prisma/client';
import {
  type NamespacedCache,
  type NamespaceResets,
} from '@wepublish/kv-ttl-cache/api';
import { PaymentsService } from './payments.service';
import { MolliePaymentProvider } from './payment-provider/mollie-payment-provider';
import { PayrexxSubscriptionPaymentProvider } from './payment-provider/payrexx-subscription-payment-provider';
import {
  BasePaymentProvider,
  PaymentProviderProps,
} from './payment-provider/payment-provider';
import { SellableRegistry } from './sellable/sellable-registry.service';

const startsAt = new Date('2026-01-01T00:00:00.000Z');
const endsAt = new Date('2027-01-01T00:00:00.000Z');

const subscriptionInvoice = {
  id: 'inv-1',
  subscriptionID: 'sub-1',
  sellableKind: null,
  userID: null,
  paidAt: null,
  canceledAt: null,
  currency: Currency.CHF,
  items: [{ amount: 0, quantity: 1 }],
} as any;

const sellableInvoice = {
  id: 'inv-1',
  subscriptionID: null,
  sellableKind: SellableKind.giftCode,
  userID: 'user-1',
  paidAt: null,
  canceledAt: null,
  currency: Currency.CHF,
  items: [{ amount: 0, quantity: 1 }],
} as any;

const buildPrisma = (
  invoice: Record<string, unknown>,
  paymentProviderID: string
) => {
  const payments = new Map<string, Record<string, unknown>>();

  return {
    paymentMethod: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'pm-1',
        paymentProviderID,
        active: true,
      }),
    },
    settingPaymentProvider: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    payment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }: any) => {
        const payment = {
          id: 'pay-1',
          intentID: null,
          intentData: null,
          intentSecret: null,
          paymentData: null,
          ...data,
        };
        payments.set(payment.id, payment);
        return payment;
      }),
      findUnique: vi
        .fn()
        .mockImplementation(
          async ({ where }: any) => payments.get(where.id) ?? null
        ),
      update: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const payment = { ...payments.get(where.id), ...data };
        payments.set(where.id, payment);
        return payment;
      }),
    },
    invoice: {
      findUnique: vi.fn().mockResolvedValue(invoice),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    subscription: {
      update: vi.fn().mockResolvedValue({
        id: 'sub-1',
        monthlyAmount: 1000,
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        memberPlan: { slug: 'plan', productType: ProductType.Subscription },
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'sub-1',
        userID: 'user-1',
        paymentMethodID: 'pm-1',
        periods: [{ invoiceID: 'inv-1', startsAt, endsAt }],
        deactivation: null,
      }),
    },
    subscriptionDeactivation: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    paymentProviderCustomer: {
      findFirst: vi.fn().mockResolvedValue({ customerID: 'cus-1' }),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
};

const setup = <T extends BasePaymentProvider>(
  Provider: new (props: PaymentProviderProps) => T,
  invoice: Record<string, unknown>
) => {
  const prisma = buildPrisma(invoice, 'provider');
  const provider = new Provider({
    id: 'provider',
    incomingRequestHandler: bodyParser.json(),
    prisma: prisma as unknown as PrismaClient,
    kv: {
      getOrLoadNs: vi.fn().mockResolvedValue({ offSessionPayments: true }),
    } as unknown as NamespacedCache,
    resets: { reset: vi.fn() } as unknown as NamespaceResets,
  });
  const createIntent = vi.spyOn(
    provider as BasePaymentProvider,
    'createIntent'
  );
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const service = new PaymentsService(
    prisma as any,
    { paymentProviders: [provider] } as any,
    notifier as any,
    { reset: vi.fn() } as any,
    new SellableRegistry()
  );

  return { prisma, provider, createIntent, notifier, service };
};

describe('PaymentsService with a zero total and a real provider', () => {
  it('pays the first invoice of a new subscription and extends the subscription', async () => {
    const { prisma, createIntent, notifier, service } = setup(
      MolliePaymentProvider,
      subscriptionInvoice
    );

    const payment = await service.createPaymentWithProvider({
      paymentMethodID: 'pm-1',
      invoice: subscriptionInvoice,
      saveCustomer: true,
      userId: 'user-1',
    });

    expect(payment).toMatchObject({
      state: PaymentState.paid,
      intentSecret: '',
    });
    expect(createIntent).not.toHaveBeenCalled();
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { paidAt: expect.any(Date), canceledAt: null },
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { paidUntil: endsAt },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
  });

  it('pays an upgrade invoice that credit and discount bring down to zero', async () => {
    const upgradeInvoice = {
      ...subscriptionInvoice,
      items: [
        { amount: 0, quantity: 1, discountCodeId: 'dc-1' },
        { amount: 0, quantity: 1, goodieId: 'goodie-1' },
      ],
    };
    const { prisma, createIntent, notifier, service } = setup(
      MolliePaymentProvider,
      upgradeInvoice
    );

    const payment = await service.createPaymentWithProvider({
      paymentMethodID: 'pm-1',
      invoice: upgradeInvoice,
      saveCustomer: true,
      userId: 'user-1',
    });

    expect(payment).toMatchObject({
      state: PaymentState.paid,
      intentSecret: '',
    });
    expect(createIntent).not.toHaveBeenCalled();
    expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { paidUntil: endsAt },
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
  });

  it('pays a free sellable invoice', async () => {
    const { prisma, createIntent, notifier, service } = setup(
      MolliePaymentProvider,
      sellableInvoice
    );

    const payment = await service.createStandaloneInvoicePayment({
      invoice: sellableInvoice,
      paymentMethodID: 'pm-1',
    });

    expect(payment).toMatchObject({
      state: PaymentState.paid,
      intentSecret: '',
    });
    expect(createIntent).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', paidAt: null, canceledAt: null },
      data: { paidAt: expect.any(Date) },
    });
    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
  });

  it('pays the first invoice of a Payrexx subscription locally, without a remote subscription', async () => {
    const { prisma, createIntent, notifier, service } = setup(
      PayrexxSubscriptionPaymentProvider,
      subscriptionInvoice
    );

    const payment = await service.createPaymentWithProvider({
      paymentMethodID: 'pm-1',
      invoice: subscriptionInvoice,
      saveCustomer: true,
      userId: 'user-1',
    });

    expect(payment).toMatchObject({
      state: PaymentState.paid,
      intentSecret: '',
    });
    expect(createIntent).not.toHaveBeenCalled();
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { paidAt: expect.any(Date), canceledAt: null },
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { paidUntil: endsAt },
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
  });
});

describe('PaymentsService.settleSubscriptionInvoiceWithoutCharge', () => {
  const openInvoice = {
    ...subscriptionInvoice,
    items: [{ amount: 12000, quantity: 1 }],
  };

  it('pays an open subscription invoice through the paid pipeline without contacting the provider', async () => {
    const { prisma, createIntent, notifier, service } = setup(
      MolliePaymentProvider,
      openInvoice
    );

    const payment =
      await service.settleSubscriptionInvoiceWithoutCharge('inv-1');

    expect(payment).toMatchObject({
      state: PaymentState.paid,
      intentSecret: '',
      paymentMethodID: 'pm-1',
      invoiceID: 'inv-1',
    });
    expect(createIntent).not.toHaveBeenCalled();
    expect(prisma.paymentMethod.findUnique).toHaveBeenCalledWith({
      where: { id: 'pm-1' },
    });
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { paidAt: expect.any(Date), canceledAt: null },
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { paidUntil: endsAt },
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
  });

  it.each([
    ['a missing invoice', null],
    ['a sellable invoice', sellableInvoice],
    ['a paid invoice', { ...openInvoice, paidAt: new Date() }],
    ['a canceled invoice', { ...openInvoice, canceledAt: new Date() }],
  ])('rejects %s', async (_, invoice) => {
    const { prisma, notifier, service } = setup(
      MolliePaymentProvider,
      openInvoice
    );
    prisma.invoice.findUnique.mockResolvedValue(invoice);

    await expect(
      service.settleSubscriptionInvoiceWithoutCharge('inv-1')
    ).rejects.toThrow(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it('rejects an invoice with a running payment', async () => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.payment.findFirst.mockResolvedValue({ id: 'running' });

    await expect(
      service.settleSubscriptionInvoiceWithoutCharge('inv-1')
    ).rejects.toThrow(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('leaves the payment method and the stored customers of the subscription alone', async () => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userID: 'user-1',
      paymentMethodID: 'pm-1',
      memberPlan: { migrateToTargetPaymentMethodID: 'pm-2' },
      periods: [{ invoiceID: 'inv-1', startsAt, endsAt }],
      deactivation: null,
    });

    await service.settleSubscriptionInvoiceWithoutCharge('inv-1');

    for (const [args] of prisma.subscription.update.mock.calls) {
      expect(args.data).not.toHaveProperty('paymentMethodID');
    }
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ paymentMethodID: 'pm-1' }),
    });
    expect(prisma.paymentProviderCustomer.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a subscription that its payment provider charges on its own', async () => {
    const { prisma, notifier, service } = setup(
      PayrexxSubscriptionPaymentProvider,
      openInvoice
    );

    await expect(
      service.settleSubscriptionInvoiceWithoutCharge('inv-1')
    ).rejects.toThrow(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it('rejects a subscription whose payment provider is not configured', async () => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.paymentMethod.findUnique.mockResolvedValue({
      id: 'pm-1',
      paymentProviderID: 'unknown',
      active: true,
    });

    await expect(
      service.settleSubscriptionInvoiceWithoutCharge('inv-1')
    ).rejects.toThrow('paymentProvider not found');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});

describe('PaymentsService.assertSubscriptionInvoiceSettleable', () => {
  const openInvoice = {
    ...subscriptionInvoice,
    items: [{ amount: 12000, quantity: 1 }],
  };

  it('accepts an open subscription invoice without paying it', async () => {
    const { prisma, notifier, service } = setup(
      MolliePaymentProvider,
      openInvoice
    );

    await expect(
      service.assertSubscriptionInvoiceSettleable('inv-1')
    ).resolves.toBeUndefined();
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing invoice', null],
    ['a sellable invoice', sellableInvoice],
    ['a paid invoice', { ...openInvoice, paidAt: new Date() }],
    ['a canceled invoice', { ...openInvoice, canceledAt: new Date() }],
  ])('rejects %s', async (_, invoice) => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.invoice.findUnique.mockResolvedValue(invoice);

    await expect(
      service.assertSubscriptionInvoiceSettleable('inv-1')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an invoice with a running payment', async () => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.payment.findFirst.mockResolvedValue({ id: 'running' });

    await expect(
      service.assertSubscriptionInvoiceSettleable('inv-1')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a subscription that its payment provider charges on its own', async () => {
    const { service } = setup(PayrexxSubscriptionPaymentProvider, openInvoice);

    await expect(
      service.assertSubscriptionInvoiceSettleable('inv-1')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a subscription whose payment provider is not configured', async () => {
    const { prisma, service } = setup(MolliePaymentProvider, openInvoice);
    prisma.paymentMethod.findUnique.mockResolvedValue({
      id: 'pm-1',
      paymentProviderID: 'unknown',
      active: true,
    });

    await expect(
      service.assertSubscriptionInvoiceSettleable('inv-1')
    ).rejects.toThrow(BadRequestException);
  });
});
