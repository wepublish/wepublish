import { PrismaClient } from '@prisma/client';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailRecipientBase, MailSubscriptionState } from './mail-send.model';
import { matches } from './where-matcher';

const makeService = (prisma: any) =>
  new MailSendRecipientService(prisma as PrismaClient);

describe('MailSendRecipientService', () => {
  describe('allowsSubscriptionTemplates', () => {
    it('is true for the bases that bind a subscription', () => {
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
      // Win-back mails carry the subscription that ended.
      expect(
        service.allowsSubscriptionTemplates({
          base: MailRecipientBase.endedSubscription,
        })
      ).toBe(true);
    });
  });

  describe('countUsers', () => {
    it('counts users directly for the user-based audiences', async () => {
      const prisma = { user: { count: jest.fn(async () => 14) } };
      const service = makeService(prisma);

      expect(
        await service.countUsers({ base: MailRecipientBase.allUsers })
      ).toBe(14);
      expect(prisma.user.count).toHaveBeenCalledWith();

      expect(
        await service.countUsers({
          base: MailRecipientBase.noActiveSubscription,
        })
      ).toBe(14);
    });

    it('counts distinct owners for a subscription audience', async () => {
      // Someone with two matching subscriptions is two mails but one person.
      const prisma = { user: { count: jest.fn(async () => 6) } };
      const count = await makeService(prisma).countUsers({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1'],
      });

      expect(count).toBe(6);
      const where = (prisma.user.count as jest.Mock).mock.calls[0][0].where;
      expect(where.subscriptions.some).toEqual({
        AND: [{ memberPlanID: { in: ['plan-1'] } }],
      });
    });

    it('counts distinct owners for the win-back audience', async () => {
      const prisma = { user: { count: jest.fn(async () => 3) } };
      await makeService(prisma).countUsers({
        base: MailRecipientBase.endedSubscription,
      });

      const where = (prisma.user.count as jest.Mock).mock.calls[0][0].where;
      expect(where.subscriptions.some.AND[0].deactivation.date).toBeDefined();
    });
  });

  describe('win-back audience (endedSubscription)', () => {
    const whereFor = async (audience: any) => {
      const prisma = { subscription: { count: jest.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.endedSubscription,
        ...audience,
      });

      return (prisma.subscription.count as jest.Mock).mock.calls[0][0].where;
    };

    it('matches on the deactivation date inside the window', async () => {
      const before = Date.now();
      const where = await whereFor({ endedWithinDays: 30 });
      const after = Date.now();

      const { gte, lte } = where.AND[0].deactivation.date;

      expect(lte.getTime()).toBeGreaterThanOrEqual(before);
      expect(lte.getTime()).toBeLessThanOrEqual(after);
      expect(lte.getTime() - gte.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('defaults the window to 90 days', async () => {
      const where = await whereFor({});
      const { gte, lte } = where.AND[0].deactivation.date;

      expect(lte.getTime() - gte.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
    });

    it('excludes people who subscribed again', async () => {
      const where = await whereFor({});

      expect(where.AND[2].user.subscriptions.none).toMatchObject({
        confirmed: true,
      });
    });

    it('uses an explicit period when one is given', async () => {
      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-03-31T23:59:59.999Z');
      const where = await whereFor({ endedFrom: from, endedTo: to });
      const { gte, lte } = where.AND[0].deactivation.date;

      expect(gte).toEqual(from);
      expect(lte).toEqual(to);
    });

    it('ignores the rolling window once a period is set', async () => {
      const from = new Date('2026-01-01T00:00:00.000Z');
      const where = await whereFor({ endedFrom: from, endedWithinDays: 7 });
      const { gte } = where.AND[0].deactivation.date;

      expect(gte).toEqual(from);
    });

    it('narrows by member plan when given', async () => {
      const where = await whereFor({ memberPlanIDs: ['plan-1'] });

      expect(where.AND).toContainEqual({
        memberPlanID: { in: ['plan-1'] },
      });
    });

    it('resolves recipients bound to the subscription that ended', async () => {
      const prisma = {
        subscription: {
          findMany: jest.fn(async () => [
            { id: 'sub-1', user: { id: 'user-1' }, memberPlanID: 'plan-1' },
          ]),
        },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.endedSubscription },
        0,
        10
      );

      expect(recipients).toEqual([
        {
          user: { id: 'user-1' },
          subscription: { id: 'sub-1', memberPlanID: 'plan-1' },
        },
      ]);
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

/**
 * Semantic coverage of the audience filters: fixtures mirroring the seeded test
 * subscribers are run through the `where` the service builds. Shape assertions
 * alone let a wrong filter pass, so these state which recipients an audience
 * must include and exclude.
 */
describe('audience filtering (semantics)', () => {
  const days = (offset: number) =>
    new Date(Date.now() + offset * 24 * 60 * 60 * 1000);

  const subscriptionWhereFor = async (audience: any) => {
    const prisma = { subscription: { count: jest.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.subscription.count as jest.Mock).mock.calls[0][0].where;
  };

  const userWhereFor = async (audience: any) => {
    const prisma = { user: { count: jest.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.user.count as jest.Mock).mock.calls[0][0].where;
  };

  /** Builds a subscription plus the owner's other subscriptions. */
  const subscription = (overrides: Record<string, any> = {}) => {
    const self = {
      confirmed: true,
      autoRenew: false,
      deactivation: null,
      paidUntil: days(-20),
      memberPlanID: 'plan-chf',
      paymentMethodID: 'payrexx',
      paymentPeriodicity: 'yearly',
      ...overrides,
    };

    return {
      ...self,
      // The win-back filter walks back to the owner's other subscriptions.
      user: { subscriptions: [self, ...(overrides['siblings'] ?? [])] },
    };
  };

  describe('win-back (endedSubscription)', () => {
    const included = async (row: any, audience: any = {}) =>
      matches(
        row,
        await subscriptionWhereFor({
          base: MailRecipientBase.endedSubscription,
          ...audience,
        })
      );

    it('excludes an overdue subscription that still auto-renews', async () => {
      // Regression: abo.offene.rechnung — unpaid and past paidUntil, but in
      // collection, not ended. It never left, so it must not be won back.
      const dunning = subscription({
        autoRenew: true,
        paidUntil: days(-3),
        deactivation: null,
      });

      expect(await included(dunning)).toBe(false);
    });

    it('includes it once collection gave up and deactivated it', async () => {
      const givenUp = subscription({
        autoRenew: true,
        paidUntil: days(-30),
        deactivation: { date: days(-30) },
      });

      expect(await included(givenUp)).toBe(true);
    });

    it('includes a subscription that ran out and was deactivated for it', async () => {
      // What the periodic job leaves behind for an expired, non-renewing
      // subscription: a deactivation dated at paidUntil.
      const lapsed = subscription({
        autoRenew: false,
        paidUntil: days(-20),
        deactivation: { date: days(-20) },
      });

      expect(await included(lapsed)).toBe(true);
    });

    it('ignores a subscription that is past paidUntil but not deactivated yet', async () => {
      // Transient state between expiry and the next periodic job run. The job
      // writes a deactivation dated at paidUntil, and the window then catches
      // it — so nothing is lost by leaving it out here.
      const notSweptUpYet = subscription({
        autoRenew: false,
        paidUntil: days(-20),
        deactivation: null,
      });

      expect(await included(notSweptUpYet)).toBe(false);
    });

    it('includes a subscription deactivated inside the window', async () => {
      const cancelled = subscription({
        paidUntil: days(-120),
        deactivation: { date: days(-30) },
      });

      expect(await included(cancelled)).toBe(true);
    });

    it('excludes a subscription deactivated before the window', async () => {
      const old = subscription({
        paidUntil: days(-400),
        deactivation: { date: days(-200) },
      });

      expect(await included(old)).toBe(false);
    });

    it('excludes a subscription that is still running', async () => {
      const running = subscription({ autoRenew: false, paidUntil: days(10) });

      expect(await included(running)).toBe(false);
    });

    it('excludes a cancellation that only takes effect in the future', async () => {
      // Cancelling a paid subscription records the deactivation at the day it
      // will actually end — until then the person is still being served.
      const cancelledButStillServed = subscription({
        paidUntil: days(120),
        deactivation: { date: days(120) },
      });

      expect(await included(cancelledButStillServed)).toBe(false);
    });

    it('excludes a subscription that was never confirmed', async () => {
      const pending = subscription({
        confirmed: false,
        paidUntil: days(-10),
        deactivation: { date: days(-10) },
      });

      expect(await included(pending)).toBe(false);
    });

    it('excludes a cancelled subscriber who has since taken a new one', async () => {
      // Already won back: the old subscription was deactivated inside the
      // window, but the person is subscribed again today.
      const wonBack = subscription({
        deactivation: { date: days(-30) },
        siblings: [
          { confirmed: true, deactivation: null, paidUntil: days(200) },
        ],
      });

      expect(await included(wonBack)).toBe(false);
    });

    it('excludes a lapsed subscriber who has since taken a new one', async () => {
      // Same, for a subscription that ended by running out.
      const wonBack = subscription({
        autoRenew: false,
        paidUntil: days(-20),
        deactivation: { date: days(-20) },
        siblings: [
          { confirmed: true, deactivation: null, paidUntil: days(365) },
        ],
      });

      expect(await included(wonBack)).toBe(false);
    });

    it('excludes them even when the new subscription is a different plan', async () => {
      const wonBackOnAnotherPlan = subscription({
        memberPlanID: 'plan-chf',
        deactivation: { date: days(-10) },
        siblings: [
          {
            confirmed: true,
            deactivation: null,
            paidUntil: days(90),
            memberPlanID: 'plan-eur',
          },
        ],
      });

      expect(await included(wonBackOnAnotherPlan)).toBe(false);
      // Also when the audience narrows to the plan of the ended subscription.
      expect(
        await included(wonBackOnAnotherPlan, { memberPlanIDs: ['plan-chf'] })
      ).toBe(false);
    });

    it('keeps someone whose other subscriptions have all ended too', async () => {
      // The exclusion must not be so broad that a second ended subscription
      // removes an otherwise valid win-back target.
      const stillLost = subscription({
        deactivation: { date: days(-30) },
        siblings: [
          {
            confirmed: true,
            deactivation: { date: days(-200) },
            paidUntil: days(-200),
          },
          {
            confirmed: true,
            deactivation: { date: days(-150) },
            paidUntil: days(-150),
          },
          // A pending signup is not an active subscription either.
          { confirmed: false, deactivation: null, paidUntil: days(400) },
        ],
      });

      expect(await included(stillLost)).toBe(true);
    });

    it('honours an explicit period', async () => {
      const endedInJanuary = subscription({
        deactivation: { date: new Date('2026-01-15T00:00:00.000Z') },
      });
      const period = {
        endedFrom: new Date('2026-01-01T00:00:00.000Z'),
        endedTo: new Date('2026-01-31T23:59:59.999Z'),
      };

      expect(await included(endedInJanuary, period)).toBe(true);
      expect(
        await included(endedInJanuary, {
          endedFrom: new Date('2026-02-01T00:00:00.000Z'),
          endedTo: new Date('2026-02-28T23:59:59.999Z'),
        })
      ).toBe(false);
    });

    it('narrows to the selected member plans', async () => {
      const ended = { deactivation: { date: days(-30) } };
      const chf = subscription({ ...ended, memberPlanID: 'plan-chf' });
      const eur = subscription({ ...ended, memberPlanID: 'plan-eur' });
      const audience = { memberPlanIDs: ['plan-chf'] };

      expect(await included(chf, audience)).toBe(true);
      expect(await included(eur, audience)).toBe(false);
    });
  });

  describe('hasSubscription', () => {
    const included = async (row: any, audience: any = {}) =>
      matches(
        row,
        await subscriptionWhereFor({
          base: MailRecipientBase.hasSubscription,
          ...audience,
        })
      );

    it('takes every subscription when nothing is narrowed', async () => {
      expect(await included(subscription({ confirmed: false }))).toBe(true);
    });

    it('active means confirmed, not deactivated and still paid', async () => {
      const audience = { subscriptionState: MailSubscriptionState.active };

      expect(
        await included(
          subscription({ confirmed: true, paidUntil: days(30) }),
          audience
        )
      ).toBe(true);
      expect(
        await included(
          subscription({ confirmed: true, paidUntil: null }),
          audience
        )
      ).toBe(true);
      expect(
        await included(
          subscription({ confirmed: true, paidUntil: days(-1) }),
          audience
        )
      ).toBe(false);
      expect(
        await included(
          subscription({ confirmed: false, paidUntil: days(30) }),
          audience
        )
      ).toBe(false);
      expect(
        await included(
          subscription({
            confirmed: true,
            paidUntil: days(30),
            deactivation: { date: days(-2) },
          }),
          audience
        )
      ).toBe(false);
    });

    it('pending means unconfirmed, deactivated means a deactivation exists', async () => {
      expect(
        await included(subscription({ confirmed: false }), {
          subscriptionState: MailSubscriptionState.pending,
        })
      ).toBe(true);
      expect(
        await included(subscription({ deactivation: { date: days(-1) } }), {
          subscriptionState: MailSubscriptionState.deactivated,
        })
      ).toBe(true);
      expect(
        await included(subscription({ deactivation: null }), {
          subscriptionState: MailSubscriptionState.deactivated,
        })
      ).toBe(false);
    });

    it('applies auto-renewal, payment method and periodicity together', async () => {
      const audience = {
        autoRenew: true,
        paymentMethodID: 'stripe',
        paymentPeriodicity: 'monthly',
      };
      const match = subscription({
        autoRenew: true,
        paymentMethodID: 'stripe',
        paymentPeriodicity: 'monthly',
      });

      expect(await included(match, audience)).toBe(true);
      expect(
        await included({ ...match, paymentMethodID: 'payrexx' }, audience)
      ).toBe(false);
      expect(
        await included({ ...match, paymentPeriodicity: 'yearly' }, audience)
      ).toBe(false);
      expect(await included({ ...match, autoRenew: false }, audience)).toBe(
        false
      );
    });

    it('an empty member plan selection matches nothing', async () => {
      expect(
        await included(subscription(), { memberPlanIDs: [] as string[] })
      ).toBe(false);
    });
  });

  describe('noActiveSubscription', () => {
    const included = async (user: any) =>
      matches(
        user,
        await userWhereFor({ base: MailRecipientBase.noActiveSubscription })
      );

    it('takes users without any subscription', async () => {
      expect(await included({ subscriptions: [] })).toBe(true);
    });

    it('takes users whose subscriptions all ended', async () => {
      expect(
        await included({
          subscriptions: [
            {
              confirmed: true,
              deactivation: { date: days(-5) },
              paidUntil: days(-5),
            },
            { confirmed: true, deactivation: null, paidUntil: days(-40) },
          ],
        })
      ).toBe(true);
    });

    it('skips users with one still-running subscription', async () => {
      expect(
        await included({
          subscriptions: [
            { confirmed: true, deactivation: null, paidUntil: days(-40) },
            { confirmed: true, deactivation: null, paidUntil: days(60) },
          ],
        })
      ).toBe(false);
    });
  });
});
