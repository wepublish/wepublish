import { GiftCodeCancellationReason, SellableKind } from '@prisma/client';
import {
  SellableInvoice,
  SellableRegistry,
  SellableRevokeReason,
} from '@wepublish/payment/api';
import { GiftCodeSellableHandler } from './gift-code-sellable.handler';
import { GiftCodeService } from './gift-code.service';
import { FeaturesService } from '@wepublish/features/api';

const paidAt = new Date('2026-10-24T12:00:00.000Z');
const item = { id: 'item-1' } as SellableInvoice['items'][number];
const invoice = {
  id: 'inv-1',
  sellableKind: SellableKind.giftCode,
  paidAt,
  items: [item],
} as SellableInvoice;

const setup = ({ giftCodesEnabled = true } = {}) => {
  const registry = new SellableRegistry();
  const features = {
    isEnabled: vi.fn().mockResolvedValue(giftCodesEnabled),
  };
  const service = {
    issueForInvoiceItem: vi.fn().mockResolvedValue(undefined),
    cancelForInvoiceItem: vi.fn().mockResolvedValue(undefined),
    paymentMethodIdsForInvoiceItem: vi.fn().mockResolvedValue(['pm-1', 'pm-2']),
  };
  const handler = new GiftCodeSellableHandler(
    registry,
    service as unknown as GiftCodeService,
    features as unknown as FeaturesService
  );

  return { handler, registry, service, features };
};

describe('GiftCodeSellableHandler', () => {
  it('handles gift codes', () => {
    expect(setup().handler.kind).toBe(SellableKind.giftCode);
  });

  it('registers itself on init', () => {
    const { handler, registry } = setup();

    handler.onModuleInit();

    expect(registry.get(SellableKind.giftCode)).toBe(handler);
  });

  it('issues the code of the line at the payment date', async () => {
    const { handler, service } = setup();

    await handler.fulfil(item, invoice);

    expect(service.issueForInvoiceItem).toHaveBeenCalledWith('item-1', paidAt);
  });

  it.each([
    [SellableRevokeReason.chargeback, GiftCodeCancellationReason.chargeback],
    [
      SellableRevokeReason.invoiceCanceled,
      GiftCodeCancellationReason.invoiceCanceled,
    ],
  ])('revokes for %s with reason %s', async (reason, cancellationReason) => {
    const { handler, service } = setup();

    await handler.revoke(item, invoice, reason);

    expect(service.cancelForInvoiceItem).toHaveBeenCalledWith(
      'item-1',
      cancellationReason
    );
  });

  it("allows only the offer's payment methods for the line", async () => {
    const { handler, service } = setup();

    await expect(
      handler.allowedPaymentMethodIds(item, invoice)
    ).resolves.toEqual(['pm-1', 'pm-2']);
    expect(service.paymentMethodIdsForInvoiceItem).toHaveBeenCalledWith(
      'item-1'
    );
  });

  it.each([true, false])(
    'is available when the gift-codes feature is %s',
    async giftCodesEnabled => {
      const { handler, features } = setup({ giftCodesEnabled });

      await expect(handler.isAvailable()).resolves.toBe(giftCodesEnabled);
      expect(features.isEnabled).toHaveBeenCalledWith('gift-codes');
    }
  );
});
