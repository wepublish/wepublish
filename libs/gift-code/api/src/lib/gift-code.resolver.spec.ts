import { NotFoundException } from '@nestjs/common';
import { Currency, UserRole } from '@prisma/client';
import { AuthSessionType, UserSession } from '@wepublish/authentication/api';
import { FEATURE_METADATA_KEY, FeaturesService } from '@wepublish/features/api';
import {
  CanGetGiftCodes,
  CanUpdateGiftCodes,
  Permission,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { AUTHENTICATED_METADATA_KEY } from '@wepublish/authentication/api';
import { UserDataloaderService } from '@wepublish/user/api';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import { GiftCodePurchaseDataloader } from './gift-code-purchase.dataloader';
import { GiftCodeResolver } from './gift-code.resolver';
import { GiftCodeService } from './gift-code.service';
import { GiftCodeStatus } from './gift-code-status';

const issuedAt = new Date('2026-10-01T00:00:00.000Z');

const giftCode = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'gc-1',
    code: 'ABCDEFGHJKMN',
    offerId: 'offer-1',
    invoiceItemId: 'item-1',
    buyerId: 'buyer-1',
    issuedAt,
    expiresAt: null,
    redeemedAt: null,
    canceledAt: null,
    ...overrides,
  }) as never;

const session = (userId: string, permissions: Permission[] = []): UserSession =>
  ({
    type: AuthSessionType.User,
    id: 'session-1',
    user: { id: userId, email: `${userId}@example.com` },
    roles: [
      {
        id: 'role-1',
        permissionIDs: permissions.map(({ id }) => id),
      } as UserRole,
    ],
  }) as UserSession;

const admin = session('admin-1', [CanGetGiftCodes]);

const setup = () => {
  const service = {
    getGiftCodes: vi.fn().mockResolvedValue({ nodes: [] }),
    getGiftCode: vi.fn().mockResolvedValue(giftCode()),
    getMyGiftCodes: vi.fn().mockResolvedValue([giftCode()]),
    purchase: vi.fn().mockResolvedValue({ id: 'payment-1' }),
    pay: vi.fn().mockResolvedValue({ id: 'payment-2' }),
    cancel: vi.fn().mockResolvedValue(giftCode({ canceledAt: issuedAt })),
  };
  const offers = { load: vi.fn().mockResolvedValue({ id: 'offer-1' }) };
  const purchases = {
    load: vi.fn().mockResolvedValue({
      id: 'item-1',
      amount: 6000,
      quantity: 2,
      invoiceId: 'inv-1',
      invoices: { id: 'inv-1', currency: Currency.CHF, paidAt: null },
    }),
  };
  const users = { load: vi.fn().mockResolvedValue({ id: 'buyer-1' }) };
  const features = { isEnabled: vi.fn().mockResolvedValue(true) };

  const resolver = new GiftCodeResolver(
    service as unknown as GiftCodeService,
    offers as unknown as GiftCodeOfferDataloader,
    purchases as unknown as GiftCodePurchaseDataloader,
    users as unknown as UserDataloaderService,
    features as unknown as FeaturesService
  );

  return { resolver, service, offers, purchases, users, features };
};

const metadataOf = (key: string, method: keyof GiftCodeResolver) =>
  Reflect.getMetadata(key, GiftCodeResolver.prototype[method]);

describe('GiftCodeResolver', () => {
  it.each([
    'giftCodes',
    'giftCode',
    'purchaseGiftCode',
    'payGiftCode',
    'cancelGiftCode',
  ] as const)('requires the gift-codes feature for %s', method => {
    expect(metadataOf(FEATURE_METADATA_KEY, method)).toEqual(['gift-codes']);
  });

  it('does not guard myGiftCodes with the gift-codes feature', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, GiftCodeResolver)
    ).toBeUndefined();
    expect(metadataOf(FEATURE_METADATA_KEY, 'myGiftCodes')).toBeUndefined();
  });

  it.each([
    ['giftCodes', CanGetGiftCodes],
    ['giftCode', CanGetGiftCodes],
    ['cancelGiftCode', CanUpdateGiftCodes],
  ] as const)('guards %s with its permission', (method, permission) => {
    expect(metadataOf(PERMISSIONS_METADATA_KEY, method)).toEqual([permission]);
  });

  it.each(['myGiftCodes', 'purchaseGiftCode', 'payGiftCode'] as const)(
    'requires a login for %s',
    method => {
      expect(metadataOf(AUTHENTICATED_METADATA_KEY, method)).toBe(true);
      expect(metadataOf(PERMISSIONS_METADATA_KEY, method)).toBeUndefined();
    }
  );

  it('lists the codes of the session user', async () => {
    const { resolver, service } = setup();

    await resolver.myGiftCodes(session('buyer-1'));

    expect(service.getMyGiftCodes).toHaveBeenCalledWith('buyer-1');
  });

  it('lists no codes when the gift-codes feature is off', async () => {
    const { resolver, service, features } = setup();
    features.isEnabled.mockResolvedValue(false);

    await expect(resolver.myGiftCodes(session('buyer-1'))).resolves.toEqual([]);
    expect(features.isEnabled).toHaveBeenCalledWith('gift-codes');
    expect(service.getMyGiftCodes).not.toHaveBeenCalled();
  });

  it('purchases for the session user', async () => {
    const { resolver, service } = setup();
    const input = { offerId: 'offer-1', recipientName: 'Anna' };

    await expect(
      resolver.purchaseGiftCode(input, session('buyer-1'))
    ).resolves.toEqual({ id: 'payment-1' });

    expect(service.purchase).toHaveBeenCalledWith(
      { id: 'buyer-1', email: 'buyer-1@example.com' },
      input
    );
  });

  it('pays for the session user', async () => {
    const { resolver, service } = setup();
    const input = { id: 'gc-1', paymentMethodId: 'pm-1' };

    await resolver.payGiftCode(input, session('buyer-1'));

    expect(service.pay).toHaveBeenCalledWith('buyer-1', input);
  });

  it('records the admin who cancels', async () => {
    const { resolver, service } = setup();

    await resolver.cancelGiftCode('gc-1', session('admin-1'));

    expect(service.cancel).toHaveBeenCalledWith('gc-1', 'admin-1');
  });

  it('throws for an unknown code', async () => {
    const { resolver, service } = setup();
    service.getGiftCode.mockResolvedValue(null);

    await expect(resolver.giftCode('missing')).rejects.toThrow(
      NotFoundException
    );
  });

  describe('code', () => {
    it.each([
      ['an anonymous caller', giftCode(), null],
      ['another user', giftCode(), session('other-1')],
      [
        'the buyer before issuance',
        giftCode({ issuedAt: null }),
        session('buyer-1'),
      ],
      [
        'the buyer after cancellation',
        giftCode({ canceledAt: issuedAt }),
        session('buyer-1'),
      ],
      [
        'a user with other permissions',
        giftCode(),
        session('editor-1', [CanUpdateGiftCodes]),
      ],
    ])('is hidden from %s', (_, parent, caller) => {
      const { resolver } = setup();

      expect(resolver.code(parent, caller)).toBeNull();
    });

    it('is shown formatted to the buyer of an issued code', () => {
      const { resolver } = setup();

      expect(resolver.code(giftCode(), session('buyer-1'))).toBe(
        'ABCD-EFGH-JKMN'
      );
    });

    it('is shown to an admin, even before issuance or after cancellation', () => {
      const { resolver } = setup();

      expect(resolver.code(giftCode({ issuedAt: null }), admin)).toBe(
        'ABCD-EFGH-JKMN'
      );
      expect(resolver.code(giftCode({ canceledAt: issuedAt }), admin)).toBe(
        'ABCD-EFGH-JKMN'
      );
    });

    it('is shown to an api token with the permission', () => {
      const { resolver } = setup();

      expect(
        resolver.code(giftCode(), {
          type: AuthSessionType.ApiToken,
          id: 'token-1',
          name: 'Token',
          token: 'secret',
          permissions: [CanGetGiftCodes.id],
        })
      ).toBe('ABCD-EFGH-JKMN');
    });
  });

  describe('buyer', () => {
    it('is hidden from the buyer and anonymous callers', async () => {
      const { resolver, users } = setup();

      await expect(
        resolver.buyer(giftCode(), session('buyer-1'))
      ).resolves.toBeNull();
      await expect(resolver.buyer(giftCode(), null)).resolves.toBeNull();
      expect(users.load).not.toHaveBeenCalled();
    });

    it('is loaded for an admin', async () => {
      const { resolver, users } = setup();

      await expect(resolver.buyer(giftCode(), admin)).resolves.toEqual({
        id: 'buyer-1',
      });
      expect(users.load).toHaveBeenCalledWith('buyer-1');
    });

    it('is null for an admin when the buyer was deleted', async () => {
      const { resolver, users } = setup();

      await expect(
        resolver.buyer(giftCode({ buyerId: null }), admin)
      ).resolves.toBeNull();
      expect(users.load).not.toHaveBeenCalled();
    });
  });

  it('derives the status', () => {
    const { resolver } = setup();

    expect(resolver.status(giftCode({ issuedAt: null }))).toBe(
      GiftCodeStatus.ordered
    );
    expect(resolver.status(giftCode())).toBe(GiftCodeStatus.issued);
  });

  it('loads the offer', async () => {
    const { resolver, offers } = setup();

    await expect(resolver.offer(giftCode())).resolves.toEqual({
      id: 'offer-1',
    });
    expect(offers.load).toHaveBeenCalledWith('offer-1');
  });

  it('reads amount, currency, invoice and paid state from the purchase', async () => {
    const { resolver, purchases } = setup();

    await expect(resolver.amount(giftCode())).resolves.toBe(12000);
    await expect(resolver.currency(giftCode())).resolves.toBe(Currency.CHF);
    await expect(resolver.invoiceId(giftCode())).resolves.toBe('inv-1');
    await expect(resolver.paid(giftCode())).resolves.toBe(false);
    expect(purchases.load).toHaveBeenCalledWith('item-1');
  });

  it('is paid once the invoice is paid', async () => {
    const { resolver, purchases } = setup();
    purchases.load.mockResolvedValue({
      id: 'item-1',
      amount: 6000,
      quantity: 1,
      invoiceId: 'inv-1',
      invoices: { id: 'inv-1', currency: Currency.CHF, paidAt: issuedAt },
    });

    await expect(resolver.paid(giftCode())).resolves.toBe(true);
  });
});
