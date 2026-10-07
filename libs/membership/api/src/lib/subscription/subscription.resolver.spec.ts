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
});
