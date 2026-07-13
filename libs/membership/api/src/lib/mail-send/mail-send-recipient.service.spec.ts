import { PrismaClient } from '@prisma/client';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailRecipientBase, MailSubscriptionState } from './mail-send.model';

const makeService = (prisma: any) =>
  new MailSendRecipientService(prisma as PrismaClient);

describe('MailSendRecipientService', () => {
  describe('allowsSubscriptionTemplates', () => {
    it('is only true for the hasSubscription base', () => {
      const service = makeService({});

      expect(
        service.allowsSubscriptionTemplates({
          base: MailRecipientBase.hasSubscription,
        })
      ).toBe(true);
      expect(
        service.allowsSubscriptionTemplates({
          base: MailRecipientBase.allUsers,
        })
      ).toBe(false);
      expect(
        service.allowsSubscriptionTemplates({
          base: MailRecipientBase.noActiveSubscription,
        })
      ).toBe(false);
    });
  });

  describe('count', () => {
    it('counts all users for the allUsers base', async () => {
      const prisma = { user: { count: jest.fn(async () => 42) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.allUsers,
      });

      expect(count).toBe(42);
      expect(prisma.user.count).toHaveBeenCalledWith();
    });

    it('counts matching subscriptions for the hasSubscription base', async () => {
      const prisma = { subscription: { count: jest.fn(async () => 7) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1', 'plan-2'],
      });

      expect(count).toBe(7);
      const where = (prisma.subscription.count as jest.Mock).mock.calls[0][0]
        .where;
      expect(where).toEqual({
        AND: [{ memberPlanID: { in: ['plan-1', 'plan-2'] } }],
      });
    });

    it('counts users without an active subscription', async () => {
      const prisma = { user: { count: jest.fn(async () => 3) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.noActiveSubscription,
      });

      expect(count).toBe(3);
      const where = (prisma.user.count as jest.Mock).mock.calls[0][0].where;
      expect(where.subscriptions.none).toMatchObject({ confirmed: true });
    });
  });

  describe('buildSubscriptionWhere (via count)', () => {
    it('maps every subscription filter into the AND clause', async () => {
      const prisma = { subscription: { count: jest.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1'],
        subscriptionState: MailSubscriptionState.pending,
        autoRenew: false,
        paymentMethodID: 'pm-1',
        paymentPeriodicity: 'yearly' as any,
      });

      const and = (prisma.subscription.count as jest.Mock).mock.calls[0][0]
        .where.AND;
      expect(and).toEqual([
        { memberPlanID: { in: ['plan-1'] } },
        { confirmed: false },
        { autoRenew: false },
        { paymentMethodID: 'pm-1' },
        { paymentPeriodicity: 'yearly' },
      ]);
    });

    it('resolves an empty memberPlanIDs list to a no-match filter', async () => {
      const prisma = { subscription: { count: jest.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: [],
      });

      const and = (prisma.subscription.count as jest.Mock).mock.calls[0][0]
        .where.AND;
      expect(and).toEqual([{ memberPlanID: { in: ['___none___'] } }]);
    });

    it('encodes the active state as confirmed + not deactivated + paid', async () => {
      const prisma = { subscription: { count: jest.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        subscriptionState: MailSubscriptionState.active,
      });

      const and = (prisma.subscription.count as jest.Mock).mock.calls[0][0]
        .where.AND;
      expect(and[0]).toMatchObject({
        confirmed: true,
        deactivation: { is: null },
      });
      expect(and[0].OR[0]).toEqual({ paidUntil: null });
    });

    it('encodes the deactivated state as a present deactivation', async () => {
      const prisma = { subscription: { count: jest.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        subscriptionState: MailSubscriptionState.deactivated,
      });

      const and = (prisma.subscription.count as jest.Mock).mock.calls[0][0]
        .where.AND;
      expect(and[0]).toEqual({ deactivation: { isNot: null } });
    });
  });

  describe('resolvePage (dedup rule)', () => {
    it('returns one recipient per user for the allUsers base', async () => {
      const prisma = {
        user: {
          findMany: jest.fn(async () => [
            { id: 'u1', email: 'a@x.ch' },
            { id: 'u2', email: 'b@x.ch' },
          ]),
        },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.allUsers },
        0,
        100
      );

      expect(recipients).toHaveLength(2);
      expect(recipients[0].subscription).toBeUndefined();
      expect(recipients[0].user.id).toBe('u1');
    });

    it('returns one recipient per matching subscription (same user twice)', async () => {
      const prisma = {
        subscription: {
          findMany: jest.fn(async () => [
            { id: 's1', userID: 'u1', memberPlanID: 'p1', user: { id: 'u1' } },
            { id: 's2', userID: 'u1', memberPlanID: 'p2', user: { id: 'u1' } },
          ]),
        },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.hasSubscription },
        0,
        100
      );

      expect(recipients).toHaveLength(2);
      expect(recipients[0].user.id).toBe('u1');
      expect(recipients[0].subscription?.id).toBe('s1');
      expect(recipients[1].subscription?.id).toBe('s2');
      // the user must not leak into the subscription payload
      expect((recipients[0].subscription as any).user).toBeUndefined();
    });

    it('skips subscriptions without a user', async () => {
      const prisma = {
        subscription: {
          findMany: jest.fn(async () => [
            { id: 's1', userID: 'u1', user: { id: 'u1' } },
            { id: 's2', userID: 'u2', user: null },
          ]),
        },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.hasSubscription },
        0,
        100
      );

      expect(recipients).toHaveLength(1);
    });
  });
});
