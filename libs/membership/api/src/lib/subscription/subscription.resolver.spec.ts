import { PrismaClient } from '@prisma/client';
import { PublicSubscriptionResolver } from './subscription.resolver';

const makeResolver = (prisma: unknown) =>
  new PublicSubscriptionResolver(
    null as any,
    null as any,
    null as any,
    prisma as PrismaClient,
    null as any,
    null as any,
    null as any,
    null as any
  );

describe('PublicSubscriptionResolver', () => {
  describe('canRevertUpgrade', () => {
    it('allows reverting an upgrade that has not been paid', async () => {
      const prisma = {
        subscription: {
          findMany: vi.fn(async () => [{ id: 'replacement', invoices: [] }]),
        },
      };

      const canRevert = await makeResolver(prisma).canRevertUpgrade({
        id: 'subscription-id',
      } as any);

      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            replacesSubscriptionID: 'subscription-id',
          }),
        })
      );
      expect(canRevert).toBe(true);
    });

    it('refuses once the replacement subscription has a paid invoice', async () => {
      const prisma = {
        subscription: {
          findMany: vi.fn(async () => [
            { id: 'replacement', invoices: [{ id: 'paid-invoice' }] },
          ]),
        },
      };

      const canRevert = await makeResolver(prisma).canRevertUpgrade({
        id: 'subscription-id',
      } as any);

      expect(canRevert).toBe(false);
    });

    it('refuses for a subscription that was never upgraded', async () => {
      const prisma = {
        subscription: { findMany: vi.fn(async () => []) },
      };

      const canRevert = await makeResolver(prisma).canRevertUpgrade({
        id: 'subscription-id',
      } as any);

      expect(canRevert).toBe(false);
    });
  });

  describe('canExtend', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    const inDays = (days: number) =>
      new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    const canExtend = (
      paidUntil: Date,
      windowSetting: { value: unknown } | null
    ) => {
      const prisma = { invoice: { findFirst: vi.fn(async () => null) } };
      const resolver = new PublicSubscriptionResolver(
        null as any,
        null as any,
        null as any,
        prisma as unknown as PrismaClient,
        { load: vi.fn(async () => ({ slug: 'bexio' })) } as any,
        { load: vi.fn(async () => null) } as any,
        null as any,
        null as any,
        { load: vi.fn(async () => windowSetting) } as any
      );

      return resolver.canExtend({
        id: 'subscription-id',
        userID: 'user-id',
        paymentMethodID: 'bexio',
        extendable: true,
        paidUntil,
      } as any);
    };

    it('offers extending within the configured window', async () => {
      expect(await canExtend(inDays(300), { value: 365 })).toBe(true);
    });

    it('does not offer extending before the configured window', async () => {
      expect(await canExtend(inDays(60), { value: 45 })).toBe(false);
    });

    it('falls back to 30 days when the setting is missing', async () => {
      expect(await canExtend(inDays(25), null)).toBe(true);
      expect(await canExtend(inDays(60), null)).toBe(false);
    });
  });
});
