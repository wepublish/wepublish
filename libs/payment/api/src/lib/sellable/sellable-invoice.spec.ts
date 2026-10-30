import { Logger } from '@nestjs/common';
import { PaymentState, PrismaClient, SellableKind } from '@prisma/client';
import {
  isSellableInvoice,
  sellableTotal,
  settleSellableInvoice,
} from './sellable-invoice';

const buildPrisma = ({
  updateCount = 1,
  invoice = { id: 'inv-1', paidAt: null, canceledAt: null } as Record<
    string,
    unknown
  > | null,
} = {}) => ({
  invoice: {
    updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
    findUnique: vi.fn().mockResolvedValue(invoice),
  },
});

const asPrisma = (prisma: ReturnType<typeof buildPrisma>) =>
  prisma as unknown as PrismaClient;

describe('isSellableInvoice', () => {
  it('is false for a subscription invoice', () => {
    expect(
      isSellableInvoice({
        subscriptionID: 'sub-1',
        sellableKind: SellableKind.giftCode,
      })
    ).toBe(false);
  });

  it('is false for a subscription-less invoice that sells nothing', () => {
    expect(
      isSellableInvoice({ subscriptionID: null, sellableKind: null })
    ).toBe(false);
  });

  it('is true for a subscription-less invoice with a sellable kind', () => {
    expect(
      isSellableInvoice({
        subscriptionID: null,
        sellableKind: SellableKind.giftCode,
      })
    ).toBe(true);
  });
});

describe('settleSellableInvoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks an open invoice as paid', async () => {
    const prisma = buildPrisma();

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.paid)
    ).resolves.toBe('paid');
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', paidAt: null, canceledAt: null },
      data: { paidAt: expect.any(Date) },
    });
  });

  it('passes the admin who marked the invoice as paid through', async () => {
    const prisma = buildPrisma();

    await settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.paid, {
      manuallySetAsPaidByUserId: 'admin-1',
    });

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', paidAt: null, canceledAt: null },
      data: { paidAt: expect.any(Date), manuallySetAsPaidByUserId: 'admin-1' },
    });
  });

  it('leaves an already paid invoice unchanged', async () => {
    const prisma = buildPrisma({
      updateCount: 0,
      invoice: { id: 'inv-1', paidAt: new Date(), canceledAt: null },
    });
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.paid)
    ).resolves.toBe('unchanged');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about a payment for a canceled invoice and leaves it canceled', async () => {
    const prisma = buildPrisma({
      updateCount: 0,
      invoice: { id: 'inv-1', paidAt: null, canceledAt: new Date() },
    });
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.paid)
    ).resolves.toBe('unchanged');
    expect(warn).toHaveBeenCalledWith(
      'payment received for canceled invoice inv-1'
    );
    expect(prisma.invoice.updateMany).toHaveBeenCalledTimes(1);
  });

  it('cancels and unpays an invoice on a chargeback', async () => {
    const prisma = buildPrisma();

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.chargeback)
    ).resolves.toBe('chargedBack');
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', canceledAt: null },
      data: { paidAt: null, canceledAt: expect.any(Date) },
    });
  });

  it('leaves an already canceled invoice unchanged on a chargeback', async () => {
    const prisma = buildPrisma({ updateCount: 0 });

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', PaymentState.chargeback)
    ).resolves.toBe('unchanged');
  });

  it.each([
    PaymentState.created,
    PaymentState.submitted,
    PaymentState.processing,
    PaymentState.requiresUserAction,
    PaymentState.declined,
    PaymentState.canceled,
  ])('does nothing for %s', async state => {
    const prisma = buildPrisma();

    await expect(
      settleSellableInvoice(asPrisma(prisma), 'inv-1', state)
    ).resolves.toBe('unchanged');
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });
});

describe('sellableTotal', () => {
  it('sums amount times quantity', () => {
    expect(
      sellableTotal([
        { amount: 1500, quantity: 2 },
        { amount: 250, quantity: 1 },
      ])
    ).toBe(3250);
  });

  it('is zero without items', () => {
    expect(sellableTotal([])).toBe(0);
  });
});
