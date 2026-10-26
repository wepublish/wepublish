import { Logger } from '@nestjs/common';
import { PaymentState, SellableKind } from '@prisma/client';
import { InvoicePaidNotifier } from '../invoice-paid.listener';
import { SellableHandler, SellableRevokeReason } from './sellable-handler';
import { SellableRegistry } from './sellable-registry.service';
import {
  SellableFulfilmentError,
  SellableFulfilmentService,
} from './sellable-fulfilment.service';

const INVOICE_ID = 'inv-1';

const item = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  invoiceId: INVOICE_ID,
  name: 'Gift code',
  amount: 5000,
  quantity: 1,
  sellableKind: SellableKind.giftCode,
  fulfilledAt: null,
  revokedAt: null,
  ...overrides,
});

const createInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: INVOICE_ID,
  subscriptionID: null,
  userID: 'user-1',
  paidAt: new Date('2026-10-20T00:00:00.000Z'),
  canceledAt: null,
  items: [item('item-1')],
  ...overrides,
});

type SetupOptions = {
  invoice?: Record<string, unknown> | null;
  claimCount?: number;
  chargebacks?: number;
  withHandler?: boolean;
};

const setup = ({
  invoice = createInvoice(),
  claimCount = 1,
  chargebacks = 0,
  withHandler = true,
}: SetupOptions = {}) => {
  const prisma = {
    invoice: { findUnique: vi.fn().mockResolvedValue(invoice) },
    invoiceItem: {
      updateMany: vi.fn().mockResolvedValue({ count: claimCount }),
    },
    payment: { count: vi.fn().mockResolvedValue(chargebacks) },
  };
  const handler: SellableHandler = {
    kind: SellableKind.giftCode,
    fulfil: vi.fn().mockResolvedValue(undefined),
    revoke: vi.fn().mockResolvedValue(undefined),
  };
  const registry = new SellableRegistry();

  if (withHandler) {
    registry.register(handler);
  }

  const notifier = new InvoicePaidNotifier();
  const service = new SellableFulfilmentService(
    prisma as any,
    registry,
    notifier
  );

  return { service, prisma, handler, notifier };
};

describe('SellableFulfilmentService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers itself with the notifier on init', async () => {
    const { service, notifier, prisma } = setup();

    service.onModuleInit();
    await notifier.notify(INVOICE_ID);

    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      include: { items: { where: { sellableKind: { not: null } } } },
    });
  });

  it('does nothing for a missing invoice', async () => {
    const { service, prisma } = setup({ invoice: null });

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
  });

  it('does nothing for an invoice without sellable items', async () => {
    const { service, prisma } = setup({
      invoice: createInvoice({ items: [] }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
  });

  it('does nothing for an open invoice', async () => {
    const { service, prisma, handler } = setup({
      invoice: createInvoice({ paidAt: null }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
    expect(handler.fulfil).not.toHaveBeenCalled();
    expect(handler.revoke).not.toHaveBeenCalled();
  });

  describe('paid invoice', () => {
    it('fulfils the item and then marks it fulfilled', async () => {
      const invoice = createInvoice();
      const { service, prisma, handler } = setup({ invoice });

      await service.onInvoicePaid(INVOICE_ID);

      expect(handler.fulfil).toHaveBeenCalledWith(invoice.items[0], invoice);
      expect(prisma.invoiceItem.updateMany).toHaveBeenCalledWith({
        where: { id: 'item-1', fulfilledAt: null, revokedAt: null },
        data: { fulfilledAt: expect.any(Date) },
      });
      expect(
        vi.mocked(handler.fulfil).mock.invocationCallOrder[0]
      ).toBeLessThan(prisma.invoiceItem.updateMany.mock.invocationCallOrder[0]);
      expect(handler.revoke).not.toHaveBeenCalled();
    });

    it('does not fail when another run marked the item first', async () => {
      const { service, handler } = setup({ claimCount: 0 });

      await expect(service.onInvoicePaid(INVOICE_ID)).resolves.toBeUndefined();

      expect(handler.fulfil).toHaveBeenCalledTimes(1);
    });

    it('skips already fulfilled and revoked items', async () => {
      const { service, prisma, handler } = setup({
        invoice: createInvoice({
          items: [
            item('item-1', { fulfilledAt: new Date() }),
            item('item-2', { revokedAt: new Date() }),
          ],
        }),
      });

      await service.onInvoicePaid(INVOICE_ID);

      expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
      expect(handler.fulfil).not.toHaveBeenCalled();
    });

    it('leaves a failed item unmarked, fulfils the others and throws a SellableFulfilmentError', async () => {
      const failure = new Error('boom');
      const { service, prisma, handler } = setup({
        invoice: createInvoice({ items: [item('item-1'), item('item-2')] }),
      });
      vi.mocked(handler.fulfil).mockRejectedValueOnce(failure);

      const result = service.onInvoicePaid(INVOICE_ID);

      await expect(result).rejects.toBeInstanceOf(SellableFulfilmentError);
      await expect(result).rejects.toMatchObject({ errors: [failure] });

      expect(prisma.invoiceItem.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.invoiceItem.updateMany).toHaveBeenCalledWith({
        where: { id: 'item-2', fulfilledAt: null, revokedAt: null },
        data: { fulfilledAt: expect.any(Date) },
      });
      expect(handler.fulfil).toHaveBeenCalledTimes(2);
    });

    it('fulfils again on the next run when the process died before the item was marked', async () => {
      const invoice = createInvoice();
      const { service, prisma, handler } = setup({ invoice });
      prisma.invoiceItem.updateMany.mockRejectedValueOnce(
        new Error('connection lost')
      );

      await expect(service.onInvoicePaid(INVOICE_ID)).rejects.toBeInstanceOf(
        SellableFulfilmentError
      );
      await service.onInvoicePaid(INVOICE_ID);

      expect(handler.fulfil).toHaveBeenCalledTimes(2);
      expect(prisma.invoiceItem.updateMany).toHaveBeenCalledTimes(2);
    });

    it('names every failed item and its cause in the error message', async () => {
      const { service, handler } = setup({
        invoice: createInvoice({ items: [item('item-1'), item('item-2')] }),
      });
      vi.mocked(handler.fulfil)
        .mockRejectedValueOnce(new Error('boom'))
        .mockRejectedValueOnce(new Error('bang'));

      const error = await service.onInvoicePaid(INVOICE_ID).catch(e => e);

      expect(error.message).toContain(INVOICE_ID);
      expect(error.message).toContain('item item-1: boom');
      expect(error.message).toContain('item item-2: bang');
    });

    it('leaves the item unmarked without a registered handler', async () => {
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const { service, prisma } = setup({ withHandler: false });

      await service.onInvoicePaid(INVOICE_ID);

      expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('canceled invoice', () => {
    const canceled = (overrides: Record<string, unknown> = {}) =>
      createInvoice({ paidAt: null, canceledAt: new Date(), ...overrides });

    it('revokes with invoiceCanceled and then marks the item revoked', async () => {
      const invoice = canceled();
      const { service, prisma, handler } = setup({ invoice });

      await service.onInvoicePaid(INVOICE_ID);

      expect(handler.revoke).toHaveBeenCalledWith(
        invoice.items[0],
        invoice,
        SellableRevokeReason.invoiceCanceled
      );
      expect(prisma.invoiceItem.updateMany).toHaveBeenCalledWith({
        where: { id: 'item-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(
        vi.mocked(handler.revoke).mock.invocationCallOrder[0]
      ).toBeLessThan(prisma.invoiceItem.updateMany.mock.invocationCallOrder[0]);
      expect(handler.fulfil).not.toHaveBeenCalled();
    });

    it('revokes with chargeback when a chargeback payment exists', async () => {
      const { service, prisma, handler } = setup({
        invoice: canceled(),
        chargebacks: 1,
      });

      await service.onInvoicePaid(INVOICE_ID);

      expect(prisma.payment.count).toHaveBeenCalledWith({
        where: { invoiceID: INVOICE_ID, state: PaymentState.chargeback },
      });
      expect(handler.revoke).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        SellableRevokeReason.chargeback
      );
    });

    it('skips an already revoked item', async () => {
      const { service, prisma, handler } = setup({
        invoice: canceled({
          items: [item('item-1', { revokedAt: new Date() })],
        }),
      });

      await service.onInvoicePaid(INVOICE_ID);

      expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
      expect(handler.revoke).not.toHaveBeenCalled();
    });

    it('revokes an already fulfilled item', async () => {
      const { service, handler } = setup({
        invoice: canceled({
          items: [item('item-1', { fulfilledAt: new Date() })],
        }),
      });

      await service.onInvoicePaid(INVOICE_ID);

      expect(handler.revoke).toHaveBeenCalledTimes(1);
    });

    it('does not fail when another run marked the item first', async () => {
      const { service, handler } = setup({
        invoice: canceled(),
        claimCount: 0,
      });

      await expect(service.onInvoicePaid(INVOICE_ID)).resolves.toBeUndefined();

      expect(handler.revoke).toHaveBeenCalledTimes(1);
    });

    it('leaves a failed revoke unmarked and throws a SellableFulfilmentError', async () => {
      const { service, prisma, handler } = setup({ invoice: canceled() });
      vi.mocked(handler.revoke).mockRejectedValueOnce(new Error('boom'));

      await expect(service.onInvoicePaid(INVOICE_ID)).rejects.toBeInstanceOf(
        SellableFulfilmentError
      );

      expect(prisma.invoiceItem.updateMany).not.toHaveBeenCalled();
    });

    it('revokes again on the next run when the process died before the item was marked', async () => {
      const { service, prisma, handler } = setup({ invoice: canceled() });
      prisma.invoiceItem.updateMany.mockRejectedValueOnce(
        new Error('connection lost')
      );

      await expect(service.onInvoicePaid(INVOICE_ID)).rejects.toBeInstanceOf(
        SellableFulfilmentError
      );
      await service.onInvoicePaid(INVOICE_ID);

      expect(handler.revoke).toHaveBeenCalledTimes(2);
    });
  });
});
