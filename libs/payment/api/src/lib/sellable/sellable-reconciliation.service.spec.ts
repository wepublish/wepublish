import { Logger } from '@nestjs/common';
import { PaymentState } from '@prisma/client';
import { subDays, subMinutes } from 'date-fns';
import { SellableReconciliationService } from './sellable-reconciliation.service';

const NOW = new Date('2026-10-24T03:00:00.000Z');

const openSellable = {
  subscriptionID: null,
  paidAt: null,
  canceledAt: null,
  items: { some: { sellableKind: { not: null } } },
};

type SetupOptions = {
  pollable?: { id: string }[];
  overdue?: { id: string }[];
  outOfSync?: { id: string }[];
  payments?: Record<string, Record<string, unknown>[]>;
  cancelCount?: number;
};

const setup = ({
  pollable = [],
  overdue = [],
  outOfSync = [],
  payments = {},
  cancelCount = 1,
}: SetupOptions = {}) => {
  const provider = {
    checkIntentStatus: vi
      .fn()
      .mockImplementation(async ({ paymentID }: any) => ({
        paymentID,
        state: PaymentState.paid,
      })),
    updatePaymentWithIntentState: vi.fn().mockResolvedValue({}),
  };
  const prisma = {
    invoice: {
      findMany: vi
        .fn()
        .mockResolvedValueOnce(pollable)
        .mockResolvedValueOnce(overdue)
        .mockResolvedValueOnce(outOfSync),
      updateMany: vi.fn().mockResolvedValue({ count: cancelCount }),
    },
    payment: {
      findMany: vi
        .fn()
        .mockImplementation(
          async ({ where }: any) => payments[where.invoiceID] ?? []
        ),
    },
  };
  const paymentsService = {
    findPaymentProviderByPaymentMethodeId: vi.fn().mockResolvedValue(provider),
  };
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const service = new SellableReconciliationService(
    prisma as any,
    paymentsService as any,
    notifier as any
  );

  return { service, prisma, provider, paymentsService, notifier };
};

describe('SellableReconciliationService', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('polls the pending payments of open sellable invoices in the time window', async () => {
    const { service, prisma, provider, paymentsService, notifier } = setup({
      pollable: [{ id: 'inv-1' }],
      payments: {
        'inv-1': [
          {
            id: 'payment-1',
            intentID: 'intent-1',
            paymentMethodID: 'stripe-method',
          },
        ],
      },
    });

    const result = await service.reconcile(NOW);

    expect(prisma.invoice.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        ...openSellable,
        createdAt: { gte: subDays(NOW, 30), lte: subMinutes(NOW, 10) },
      },
      select: { id: true },
      take: 500,
    });
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: {
        invoiceID: 'inv-1',
        intentID: { not: null },
        state: {
          in: [
            PaymentState.created,
            PaymentState.submitted,
            PaymentState.processing,
            PaymentState.requiresUserAction,
          ],
        },
      },
    });
    expect(
      paymentsService.findPaymentProviderByPaymentMethodeId
    ).toHaveBeenCalledWith('stripe-method');
    expect(provider.checkIntentStatus).toHaveBeenCalledWith({
      intentID: 'intent-1',
      paymentID: 'payment-1',
    });
    expect(provider.updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState: { paymentID: 'payment-1', state: PaymentState.paid },
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-1');
    expect(
      provider.updatePaymentWithIntentState.mock.invocationCallOrder[0]
    ).toBeLessThan(notifier.notify.mock.invocationCallOrder[0]);
    expect(result).toEqual({ polled: 1, canceled: 0, resynced: 0, failed: 0 });
  });

  it('skips payments without a provider or without an intent state', async () => {
    const { service, provider, paymentsService } = setup({
      pollable: [{ id: 'inv-1' }],
      payments: {
        'inv-1': [
          { id: 'payment-1', intentID: 'intent-1', paymentMethodID: 'gone' },
          { id: 'payment-2', intentID: 'intent-2', paymentMethodID: 'stripe' },
        ],
      },
    });
    paymentsService.findPaymentProviderByPaymentMethodeId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(provider);
    provider.checkIntentStatus.mockResolvedValue(null);

    const result = await service.reconcile(NOW);

    expect(provider.checkIntentStatus).toHaveBeenCalledTimes(1);
    expect(provider.updatePaymentWithIntentState).not.toHaveBeenCalled();
    expect(result.polled).toBe(1);
  });

  it('auto-cancels overdue unpaid invoices and notifies', async () => {
    const { service, prisma, notifier } = setup({
      overdue: [{ id: 'inv-2' }],
    });

    const result = await service.reconcile(NOW);

    expect(prisma.invoice.findMany).toHaveBeenNthCalledWith(2, {
      where: { ...openSellable, scheduledDeactivationAt: { lte: NOW } },
      select: { id: true },
      take: 500,
    });
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-2', paidAt: null, canceledAt: null },
      data: { canceledAt: NOW },
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-2');
    expect(result).toEqual({ polled: 0, canceled: 1, resynced: 0, failed: 0 });
  });

  it('does not count an invoice that was settled in the meantime', async () => {
    const { service } = setup({ overdue: [{ id: 'inv-2' }], cancelCount: 0 });

    await expect(service.reconcile(NOW)).resolves.toMatchObject({
      canceled: 0,
    });
  });

  it('re-notifies out-of-sync invoices found through the claim markers', async () => {
    const { service, prisma, notifier } = setup({
      outOfSync: [{ id: 'inv-3' }, { id: 'inv-4' }],
    });

    const result = await service.reconcile(NOW);

    expect(prisma.invoice.findMany).toHaveBeenNthCalledWith(3, {
      where: {
        createdAt: { gte: subDays(NOW, 90) },
        OR: [
          {
            paidAt: { not: null },
            canceledAt: null,
            items: {
              some: {
                sellableKind: { not: null },
                fulfilledAt: null,
                revokedAt: null,
              },
            },
          },
          {
            paidAt: null,
            canceledAt: { not: null },
            items: {
              some: { sellableKind: { not: null }, revokedAt: null },
            },
          },
        ],
      },
      select: { id: true },
      take: 500,
    });
    expect(notifier.notify).toHaveBeenCalledWith('inv-3');
    expect(notifier.notify).toHaveBeenCalledWith('inv-4');
    expect(result).toEqual({ polled: 0, canceled: 0, resynced: 2, failed: 0 });
  });

  it('counts a failing invoice and carries on with the others', async () => {
    const { service, provider, notifier } = setup({
      pollable: [{ id: 'inv-1' }, { id: 'inv-2' }],
      payments: {
        'inv-1': [
          { id: 'payment-1', intentID: 'intent-1', paymentMethodID: 'stripe' },
        ],
        'inv-2': [
          { id: 'payment-2', intentID: 'intent-2', paymentMethodID: 'stripe' },
        ],
      },
      overdue: [{ id: 'inv-5' }],
    });
    provider.checkIntentStatus.mockRejectedValueOnce(new Error('timeout'));

    const result = await service.reconcile(NOW);

    expect(notifier.notify).not.toHaveBeenCalledWith('inv-1');
    expect(notifier.notify).toHaveBeenCalledWith('inv-2');
    expect(notifier.notify).toHaveBeenCalledWith('inv-5');
    expect(result).toEqual({ polled: 1, canceled: 1, resynced: 0, failed: 1 });
  });

  it('never throws, even when a query fails', async () => {
    const { service, prisma, notifier } = setup();
    prisma.invoice.findMany
      .mockReset()
      .mockRejectedValueOnce(new Error('db down'))
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce([{ id: 'inv-3' }]);

    const result = await service.reconcile(NOW);

    expect(notifier.notify).toHaveBeenCalledWith('inv-3');
    expect(result).toEqual({ polled: 0, canceled: 0, resynced: 1, failed: 2 });
  });
});
