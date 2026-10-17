import { EmailQualityLevel, MailChannel, PrismaClient } from '@prisma/client';
import {
  emailSegmentOf,
  MailSendRecipientService,
} from './mail-send-recipient.service';
import {
  MailEmailFilter,
  MailEmailSegment,
  MailHistoryMatch,
  MailRecipientBase,
  MailSubscriptionState,
} from './mail-send.model';
import { matches } from './where-matcher';
import type { Mock } from 'vitest';

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
      const prisma = { user: { count: vi.fn(async () => 14) } };
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
      const prisma = { user: { count: vi.fn(async () => 6) } };
      const count = await makeService(prisma).countUsers({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1'],
      });

      expect(count).toBe(6);
      const where = (prisma.user.count as Mock).mock.calls[0][0].where;
      expect(where.subscriptions.some).toEqual({
        AND: [{ memberPlanID: { in: ['plan-1'] } }],
      });
    });

    it('counts distinct owners for the win-back audience', async () => {
      const prisma = { user: { count: vi.fn(async () => 3) } };
      await makeService(prisma).countUsers({
        base: MailRecipientBase.endedSubscription,
      });

      const where = (prisma.user.count as Mock).mock.calls[0][0].where;
      expect(where.subscriptions.some.AND[0].deactivation.date).toBeDefined();
    });
  });

  describe('win-back audience (endedSubscription)', () => {
    const whereFor = async (audience: any) => {
      const prisma = { subscription: { count: vi.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.endedSubscription,
        ...audience,
      });

      return (prisma.subscription.count as Mock).mock.calls[0][0].where;
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
          findMany: vi.fn(async () => [
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
      const prisma = { user: { count: vi.fn(async () => 42) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.allUsers,
      });

      expect(count).toBe(42);
      expect(prisma.user.count).toHaveBeenCalledWith();
    });

    it('counts matching subscriptions for the hasSubscription base', async () => {
      const prisma = { subscription: { count: vi.fn(async () => 7) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1', 'plan-2'],
      });

      expect(count).toBe(7);
      const where = (prisma.subscription.count as Mock).mock.calls[0][0].where;
      expect(where).toEqual({
        AND: [{ memberPlanID: { in: ['plan-1', 'plan-2'] } }],
      });
    });

    it('counts users without an active subscription', async () => {
      const prisma = { user: { count: vi.fn(async () => 3) } };
      const count = await makeService(prisma).count({
        base: MailRecipientBase.noActiveSubscription,
      });

      expect(count).toBe(3);
      const where = (prisma.user.count as Mock).mock.calls[0][0].where;
      expect(where.subscriptions.none).toMatchObject({ confirmed: true });
    });
  });

  describe('buildSubscriptionWhere (via count)', () => {
    it('maps every subscription filter into the AND clause', async () => {
      const prisma = { subscription: { count: vi.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1'],
        subscriptionState: MailSubscriptionState.pending,
        autoRenew: false,
        paymentMethodID: 'pm-1',
        paymentPeriodicity: 'yearly' as any,
      });

      const and = (prisma.subscription.count as Mock).mock.calls[0][0].where
        .AND;
      expect(and).toEqual([
        { memberPlanID: { in: ['plan-1'] } },
        { confirmed: false },
        { autoRenew: false },
        { paymentMethodID: 'pm-1' },
        { paymentPeriodicity: 'yearly' },
      ]);
    });

    it('resolves an empty memberPlanIDs list to a no-match filter', async () => {
      const prisma = { subscription: { count: vi.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: [],
      });

      const and = (prisma.subscription.count as Mock).mock.calls[0][0].where
        .AND;
      expect(and).toEqual([{ memberPlanID: { in: ['___none___'] } }]);
    });

    it('encodes the active state as confirmed + not deactivated + paid', async () => {
      const prisma = { subscription: { count: vi.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        subscriptionState: MailSubscriptionState.active,
      });

      const and = (prisma.subscription.count as Mock).mock.calls[0][0].where
        .AND;
      expect(and[0]).toMatchObject({
        confirmed: true,
        deactivation: { is: null },
      });
      expect(and[0].OR[0]).toEqual({ paidUntil: null });
    });

    it('encodes the deactivated state as a present deactivation', async () => {
      const prisma = { subscription: { count: vi.fn(async () => 0) } };
      await makeService(prisma).count({
        base: MailRecipientBase.hasSubscription,
        subscriptionState: MailSubscriptionState.deactivated,
      });

      const and = (prisma.subscription.count as Mock).mock.calls[0][0].where
        .AND;
      expect(and[0]).toEqual({ deactivation: { isNot: null } });
    });
  });

  describe('resolvePage (dedup rule)', () => {
    it('returns one recipient per user for the allUsers base', async () => {
      const prisma = {
        user: {
          findMany: vi.fn(async () => [
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
          findMany: vi.fn(async () => [
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
          findMany: vi.fn(async () => [
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

  describe('letters (one per person)', () => {
    it('counts people instead of subscriptions', async () => {
      const prisma = {
        user: { count: vi.fn(async () => 11) },
        subscription: { count: vi.fn(async () => 13) },
      };
      const service = makeService(prisma);

      expect(
        await service.count(
          { base: MailRecipientBase.hasSubscription },
          MailChannel.letter
        )
      ).toBe(11);
      expect(prisma.subscription.count).not.toHaveBeenCalled();

      expect(
        await service.count(
          { base: MailRecipientBase.hasSubscription },
          MailChannel.mail
        )
      ).toBe(13);
    });

    it('resolves one recipient per user, bound to the first matching subscription', async () => {
      const prisma = {
        user: {
          findMany: vi.fn(async () => [
            { id: 'u1', subscriptions: [{ id: 's1' }] },
            { id: 'u2', subscriptions: [{ id: 's3' }] },
          ]),
        },
        subscription: { findMany: vi.fn() },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.hasSubscription, memberPlanIDs: ['p1'] },
        0,
        100,
        MailChannel.letter
      );

      expect(prisma.subscription.findMany).not.toHaveBeenCalled();
      expect(recipients.map(({ user }) => user.id)).toEqual(['u1', 'u2']);
      expect(recipients[0].subscription?.id).toBe('s1');
      expect((recipients[0].user as any).subscriptions).toBeUndefined();

      const args = (prisma.user.findMany as Mock).mock.calls[0][0];
      expect(args.where.subscriptions.some).toEqual({
        AND: [{ memberPlanID: { in: ['p1'] } }],
      });
      expect(args.include.subscriptions.take).toBe(1);
      expect(args.include.subscriptions.where).toEqual(
        args.where.subscriptions.some
      );
    });

    it('binds no subscription for the user-based audiences', async () => {
      const prisma = {
        user: { findMany: vi.fn(async () => [{ id: 'u1' }]) },
      };

      const recipients = await makeService(prisma).resolvePage(
        { base: MailRecipientBase.allUsers },
        0,
        100,
        MailChannel.letter
      );

      expect(recipients[0].subscription).toBeUndefined();
      const args = (prisma.user.findMany as Mock).mock.calls[0][0];
      expect(args.include.subscriptions).toBeUndefined();
    });

    it('counts people without an address, not subscriptions', async () => {
      const prisma = {
        user: { count: vi.fn(async () => 2) },
        subscription: { count: vi.fn() },
      };

      expect(
        await makeService(prisma).countWithoutAddress(
          { base: MailRecipientBase.endedSubscription },
          MailChannel.letter
        )
      ).toBe(2);
      expect(prisma.subscription.count).not.toHaveBeenCalled();
    });
  });

  describe('resolvePreviewPage (missing addresses first)', () => {
    it('pages through the people without an address before the rest', async () => {
      const prisma = {
        user: {
          count: vi.fn(async () => 3),
          findMany: vi.fn(async (args: any) =>
            args.skip === 2 ? [{ id: 'missing-3' }] : [{ id: 'ok-1' }]
          ),
        },
      };

      const recipients = await makeService(prisma).resolvePreviewPage(
        { base: MailRecipientBase.allUsers },
        2,
        3,
        MailChannel.letter
      );

      expect(recipients.map(({ user }) => user.id)).toEqual([
        'missing-3',
        'ok-1',
      ]);

      const calls = (prisma.user.findMany as Mock).mock.calls.map(
        ([args]) => args
      );
      expect(calls).toHaveLength(2);
      expect(calls[0]).toMatchObject({ skip: 2, take: 3 });
      expect(calls[1]).toMatchObject({ skip: 0, take: 2 });
    });

    it('skips the missing ones entirely once the page is past them', async () => {
      const prisma = {
        user: {
          count: vi.fn(async () => 3),
          findMany: vi.fn(async () => [{ id: 'ok-3' }]),
        },
      };

      await makeService(prisma).resolvePreviewPage(
        { base: MailRecipientBase.allUsers },
        5,
        10,
        MailChannel.letter
      );

      const calls = (prisma.user.findMany as Mock).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatchObject({ skip: 2, take: 10 });
    });

    it('puts every user on exactly one side of the split', async () => {
      const prisma = {
        user: {
          count: vi.fn(async () => 1),
          findMany: vi.fn(async () => []),
        },
      };

      await makeService(prisma).resolvePreviewPage(
        { base: MailRecipientBase.allUsers },
        0,
        10,
        MailChannel.letter
      );

      const [[missing], [present]] = (prisma.user.findMany as Mock).mock.calls;
      const full = {
        streetAddress: 'Hauptstrasse 1',
        streetAddress2: null,
        zipCode: '8000',
        city: 'Zürich',
        country: 'CH',
      };
      const users = {
        full: { address: full },
        street2Only: {
          address: { ...full, streetAddress: '', streetAddress2: 'Postfach' },
        },
        noAddress: { address: null },
        noZip: { address: { ...full, zipCode: null } },
        emptyCity: { address: { ...full, city: '' } },
        noStreet: { address: { ...full, streetAddress: null } },
      };

      for (const [name, user] of Object.entries(users)) {
        const isMissing = matches(user, missing.where);
        expect([name, isMissing, matches(user, present.where)]).toEqual([
          name,
          isMissing,
          !isMissing,
        ]);
      }

      expect(matches(users.full, missing.where)).toBe(false);
      expect(matches(users.street2Only, missing.where)).toBe(false);
      expect(matches(users.noAddress, missing.where)).toBe(true);
      expect(matches(users.noZip, missing.where)).toBe(true);
      expect(matches(users.emptyCity, missing.where)).toBe(true);
      expect(matches(users.noStreet, missing.where)).toBe(true);
    });

    it('keeps the plain order for a mail', async () => {
      const prisma = {
        user: {
          count: vi.fn(),
          findMany: vi.fn(async () => [{ id: 'u1' }]),
        },
      };

      await makeService(prisma).resolvePreviewPage(
        { base: MailRecipientBase.allUsers },
        0,
        10,
        MailChannel.mail
      );

      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
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
    const prisma = { subscription: { count: vi.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.subscription.count as Mock).mock.calls[0][0].where;
  };

  const userWhereFor = async (audience: any) => {
    const prisma = { user: { count: vi.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.user.count as Mock).mock.calls[0][0].where;
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

    it('ends between uses the cancellation date when one exists', async () => {
      const audience = { endsAtFrom: days(5), endsAtTo: days(15) };

      expect(
        await included(
          subscription({
            deactivation: { date: days(10) },
            paidUntil: days(-20),
          }),
          audience
        )
      ).toBe(true);
    });

    it('ends between falls back to paidUntil only when not cancelled', async () => {
      const audience = { endsAtFrom: days(5), endsAtTo: days(15) };

      expect(
        await included(
          subscription({ deactivation: null, paidUntil: days(10) }),
          audience
        )
      ).toBe(true);
      expect(
        await included(
          subscription({ deactivation: null, paidUntil: days(-20) }),
          audience
        )
      ).toBe(false);
    });

    it('ends between does not fall back to paidUntil when a cancellation is out of range', async () => {
      expect(
        await included(
          subscription({
            deactivation: { date: days(100) },
            paidUntil: days(10),
          }),
          { endsAtFrom: days(5), endsAtTo: days(15) }
        )
      ).toBe(false);
    });

    it('ends between matches neither branch without a deactivation and without paidUntil', async () => {
      expect(
        await included(subscription({ deactivation: null, paidUntil: null }), {
          endsAtFrom: days(5),
          endsAtTo: days(15),
        })
      ).toBe(false);
    });

    it('ends between accepts an open lower or upper bound', async () => {
      const row = subscription({ deactivation: null, paidUntil: days(10) });

      expect(await included(row, { endsAtFrom: days(5) })).toBe(true);
      expect(await included(row, { endsAtTo: days(15) })).toBe(true);
      expect(await included(row, { endsAtFrom: days(20) })).toBe(false);
      expect(await included(row, { endsAtTo: days(5) })).toBe(false);
    });

    it('starts between narrows on startsAt with both bounds optional', async () => {
      const row = subscription({ startsAt: days(-10) });

      expect(
        await included(row, { startsAtFrom: days(-20), startsAtTo: days(-5) })
      ).toBe(true);
      expect(await included(row, { startsAtFrom: days(-5) })).toBe(false);
      expect(await included(row, { startsAtTo: days(-20) })).toBe(false);
      expect(await included(row, { startsAtFrom: days(-20) })).toBe(true);
    });

    it('is paid keeps only subscriptions that are started and paid up', async () => {
      const audience = { isPaid: true };

      expect(
        await included(
          subscription({ startsAt: days(-30), paidUntil: days(10) }),
          audience
        )
      ).toBe(true);
      expect(
        await included(
          subscription({ startsAt: days(-30), paidUntil: days(-1) }),
          audience
        )
      ).toBe(false);
      expect(
        await included(
          subscription({ startsAt: days(5), paidUntil: days(10) }),
          audience
        )
      ).toBe(false);
    });

    it('is paid excludes an unpaid first invoice that the active state would keep', async () => {
      const row = subscription({ startsAt: days(-30), paidUntil: null });

      expect(
        await included(row, { subscriptionState: MailSubscriptionState.active })
      ).toBe(true);
      expect(await included(row, { isPaid: true })).toBe(false);
      expect(await included(row, { isPaid: false })).toBe(true);
    });

    it('is paid splits every subscription into exactly one of the two sides', async () => {
      const rows = {
        'paid up': subscription({ startsAt: days(-30), paidUntil: days(10) }),
        lapsed: subscription({ startsAt: days(-30), paidUntil: days(-1) }),
        'never paid': subscription({ startsAt: days(-30), paidUntil: null }),
        'starts later': subscription({
          startsAt: days(5),
          paidUntil: days(10),
        }),
        'never paid, starts later': subscription({
          startsAt: days(5),
          paidUntil: null,
        }),
      };

      for (const [name, row] of Object.entries(rows)) {
        const paid = await included(row, { isPaid: true });
        const unpaid = await included(row, { isPaid: false });

        expect({ [name]: unpaid }).toEqual({ [name]: !paid });
      }
    });

    it('is canceled counts a cancellation that only takes effect later', async () => {
      expect(
        await included(subscription({ deactivation: { date: days(30) } }), {
          isCanceled: true,
        })
      ).toBe(true);
      expect(
        await included(subscription({ deactivation: null }), {
          isCanceled: true,
        })
      ).toBe(false);
      expect(
        await included(subscription({ deactivation: null }), {
          isCanceled: false,
        })
      ).toBe(true);
    });

    it('has replaced subscription splits on replacesSubscriptionID', async () => {
      expect(
        await included(subscription({ replacesSubscriptionID: 'sub-old' }), {
          hasReplacedSubscription: true,
        })
      ).toBe(true);
      expect(
        await included(subscription({ replacesSubscriptionID: null }), {
          hasReplacedSubscription: true,
        })
      ).toBe(false);
      expect(
        await included(subscription({ replacesSubscriptionID: null }), {
          hasReplacedSubscription: false,
        })
      ).toBe(true);
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

  describe('email filter', () => {
    const usersWhereFor = async (
      emailFilter: MailEmailFilter,
      patterns: (string | null)[],
      base = MailRecipientBase.allUsers
    ) => {
      const prisma = {
        user: { count: vi.fn(async () => 0) },
        subscription: { count: vi.fn(async () => 0) },
        setting: { findUnique: vi.fn(async () => null) },
        settingLetterProvider: {
          findMany: vi.fn(async () =>
            patterns.map(placeholderEmailContains => ({
              placeholderEmailContains,
            }))
          ),
        },
      };

      await makeService(prisma).count({ base, emailFilter });

      return base === MailRecipientBase.allUsers ?
          (prisma.user.count as Mock).mock.calls[0][0].where
        : (prisma.subscription.count as Mock).mock.calls[0][0].where;
    };

    const placeholder = { email: 'test1234@Placeholder.neuewege.ch' };
    const real = { email: 'jane@example.com' };

    it('does not look up the settings when every address is allowed', async () => {
      const prisma = {
        user: { count: vi.fn(async () => 5) },
        settingLetterProvider: { findMany: vi.fn() },
        setting: { findUnique: vi.fn() },
      };

      await makeService(prisma).count({
        base: MailRecipientBase.allUsers,
        emailFilter: MailEmailFilter.all,
      });

      expect(prisma.settingLetterProvider.findMany).not.toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalledWith();
    });

    it('keeps only placeholder addresses, case-insensitively', async () => {
      const where = await usersWhereFor(MailEmailFilter.placeholder, [
        '@placeholder.neuewege.ch',
      ]);

      expect(matches(placeholder, where)).toBe(true);
      expect(matches(real, where)).toBe(false);
    });

    it('matches the pattern anywhere in the address', async () => {
      const where = await usersWhereFor(MailEmailFilter.placeholder, [
        'placeholder',
      ]);

      expect(matches({ email: 'placeholder-42@neuewege.ch' }, where)).toBe(
        true
      );
      expect(matches({ email: 'a@placeholder.neuewege.ch' }, where)).toBe(true);
      expect(matches(real, where)).toBe(false);
    });

    it('keeps only real addresses', async () => {
      const where = await usersWhereFor(MailEmailFilter.real, [
        '@placeholder.neuewege.ch',
      ]);

      expect(matches(placeholder, where)).toBe(false);
      expect(matches(real, where)).toBe(true);
    });

    it('excludes an address matching any of several patterns from real', async () => {
      const where = await usersWhereFor(MailEmailFilter.real, [
        '@other.ch',
        '@placeholder.neuewege.ch',
      ]);

      expect(matches(placeholder, where)).toBe(false);
      expect(matches({ email: 'a@OTHER.ch' }, where)).toBe(false);
      expect(matches(real, where)).toBe(true);
    });

    it('treats every address as real without a configured pattern', async () => {
      const placeholderWhere = await usersWhereFor(
        MailEmailFilter.placeholder,
        [null, '  ']
      );
      const realWhere = await usersWhereFor(MailEmailFilter.real, [null]);

      expect(matches(placeholder, placeholderWhere)).toBe(false);
      expect(matches(placeholder, realWhere)).toBe(true);
    });

    it('filters subscription audiences on the owner', async () => {
      const where = await usersWhereFor(
        MailEmailFilter.placeholder,
        ['@placeholder.neuewege.ch'],
        MailRecipientBase.hasSubscription
      );

      expect(matches({ user: placeholder }, where)).toBe(true);
      expect(matches({ user: real }, where)).toBe(false);
    });
  });

  describe('email segments', () => {
    const PATTERN = '@placeholder.neuewege.ch';
    const segmentWhereFor = async (
      emailSegments: MailEmailSegment[],
      {
        patterns = [PATTERN] as (string | null)[],
        base = MailRecipientBase.allUsers,
        emailFilter = undefined as MailEmailFilter | undefined,
      } = {}
    ) => {
      const prisma = {
        user: { count: vi.fn(async () => 0) },
        subscription: { count: vi.fn(async () => 0) },
        setting: { findUnique: vi.fn(async () => null) },
        settingLetterProvider: {
          findMany: vi.fn(async () =>
            patterns.map(placeholderEmailContains => ({
              placeholderEmailContains,
            }))
          ),
        },
      };

      await makeService(prisma).count({ base, emailSegments, emailFilter });

      return base === MailRecipientBase.allUsers ?
          (prisma.user.count as Mock).mock.calls[0][0].where
        : (prisma.subscription.count as Mock).mock.calls[0][0].where;
    };

    const level = (level: EmailQualityLevel) => ({ level });
    const placeholder = {
      email: 'nw-1@Placeholder.neuewege.ch',
      emailQuality: null,
    };
    // a generated address that once bounced: still a placeholder
    const placeholderDead = {
      email: 'nw-2@placeholder.neuewege.ch',
      emailQuality: level(EmailQualityLevel.dead),
    };
    const dead = {
      email: 'jane@example.com',
      emailQuality: level(EmailQualityLevel.dead),
    };
    const unresponsive = {
      email: 'jo@example.com',
      emailQuality: level(EmailQualityLevel.unresponsive),
    };
    const active = {
      email: 'al@example.com',
      emailQuality: level(EmailQualityLevel.active),
    };
    const neverEvaluated = { email: 'bob@example.com', emailQuality: null };
    const unknown = {
      email: 'kim@example.com',
      emailQuality: level(EmailQualityLevel.unknown),
    };

    it('does not restrict without segments', async () => {
      const prisma = {
        user: { count: vi.fn(async () => 5) },
        settingLetterProvider: { findMany: vi.fn() },
      };

      await makeService(prisma).count({
        base: MailRecipientBase.allUsers,
        emailSegments: [],
      });

      expect(prisma.settingLetterProvider.findMany).not.toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalledWith();
    });

    it('keeps generated addresses for the placeholder segment, whatever their level', async () => {
      const where = await segmentWhereFor([MailEmailSegment.placeholder]);

      expect(matches(placeholder, where)).toBe(true);
      expect(matches(placeholderDead, where)).toBe(true);
      expect(matches(dead, where)).toBe(false);
      expect(matches(neverEvaluated, where)).toBe(false);
    });

    it('keeps the stored level for a level segment, but never a generated address', async () => {
      const where = await segmentWhereFor([MailEmailSegment.dead]);

      expect(matches(dead, where)).toBe(true);
      expect(matches(placeholderDead, where)).toBe(false);
      expect(matches(unresponsive, where)).toBe(false);
      expect(matches(neverEvaluated, where)).toBe(false);
    });

    it('counts people never evaluated as unknown', async () => {
      const where = await segmentWhereFor([MailEmailSegment.unknown]);

      expect(matches(neverEvaluated, where)).toBe(true);
      expect(matches(unknown, where)).toBe(true);
      expect(matches(placeholder, where)).toBe(false);
      expect(matches(active, where)).toBe(false);
    });

    // The analog campaign: everyone who certainly cannot be reached by mail.
    it('takes anyone in one of several segments', async () => {
      const where = await segmentWhereFor([
        MailEmailSegment.placeholder,
        MailEmailSegment.dead,
      ]);

      expect(matches(placeholder, where)).toBe(true);
      expect(matches(dead, where)).toBe(true);
      expect(matches(unresponsive, where)).toBe(false);
      expect(matches(neverEvaluated, where)).toBe(false);
    });

    it('narrows the email filter further instead of replacing it', async () => {
      const where = await segmentWhereFor([MailEmailSegment.dead], {
        emailFilter: MailEmailFilter.placeholder,
      });

      expect(matches(dead, where)).toBe(false);
      expect(matches(placeholderDead, where)).toBe(false);
    });

    it('filters subscription audiences on the owner', async () => {
      const where = await segmentWhereFor([MailEmailSegment.unresponsive], {
        base: MailRecipientBase.hasSubscription,
      });

      expect(matches({ user: unresponsive }, where)).toBe(true);
      expect(matches({ user: active }, where)).toBe(false);
    });

    // Prisma's nested `not` filter has no `mode`; putting it there is a
    // runtime validation error, not a type error, so the shape is pinned here.
    it('spells the real-address clause in a shape Prisma accepts', async () => {
      const where = await segmentWhereFor([MailEmailSegment.dead]);
      const clauses = JSON.stringify(where);

      expect(clauses).toContain(
        JSON.stringify({ mode: 'insensitive', not: { contains: PATTERN } })
      );
      expect(clauses).not.toMatch(/"not":\{[^}]*"mode"/);
    });

    it('has no placeholders without a configured pattern, and plain levels', async () => {
      const placeholderWhere = await segmentWhereFor(
        [MailEmailSegment.placeholder],
        { patterns: [null] }
      );
      const deadWhere = await segmentWhereFor([MailEmailSegment.dead], {
        patterns: [null],
      });

      expect(matches(placeholder, placeholderWhere)).toBe(false);
      expect(matches(dead, deadWhere)).toBe(true);
      expect(matches(placeholderDead, deadWhere)).toBe(true);
    });

    it('counts the people of every segment, whatever segments are picked', async () => {
      const service = makeService({});
      const countUsers = vi
        .spyOn(service, 'countUsers')
        .mockImplementation(async ({ emailSegments }) =>
          emailSegments?.[0] === MailEmailSegment.dead ? 7 : 1
        );

      await expect(
        service.countUsersBySegment({
          base: MailRecipientBase.hasSubscription,
          emailSegments: [MailEmailSegment.placeholder],
        })
      ).resolves.toEqual([
        { segment: MailEmailSegment.placeholder, userCount: 1 },
        { segment: MailEmailSegment.dead, userCount: 7 },
        { segment: MailEmailSegment.unresponsive, userCount: 1 },
        { segment: MailEmailSegment.unknown, userCount: 1 },
        { segment: MailEmailSegment.active, userCount: 1 },
      ]);
      expect(countUsers).toHaveBeenCalledWith({
        base: MailRecipientBase.hasSubscription,
        emailSegments: [MailEmailSegment.dead],
      });
    });

    it('loads the trimmed patterns from the setting and the letter integration', async () => {
      const prisma = {
        setting: {
          findUnique: vi.fn(async () => ({ value: '@import.example.com' })),
        },
        settingLetterProvider: {
          findMany: vi.fn(async () => [
            { placeholderEmailContains: ` ${PATTERN} ` },
            { placeholderEmailContains: null },
          ]),
        },
      };

      await expect(makeService(prisma).placeholderPatterns()).resolves.toEqual([
        '@import.example.com',
        PATTERN,
      ]);
    });
  });

  describe('emailSegmentOf', () => {
    const patterns = ['@placeholder.neuewege.ch'];

    it('is the stored level for a real address', () => {
      expect(
        emailSegmentOf(
          { email: 'jane@example.com', emailQuality: { level: 'dead' } },
          patterns
        )
      ).toBe(MailEmailSegment.dead);
    });

    it('is unknown for a real address never evaluated', () => {
      expect(
        emailSegmentOf(
          { email: 'jane@example.com', emailQuality: null },
          patterns
        )
      ).toBe(MailEmailSegment.unknown);
    });

    it('is placeholder for a generated address, whatever its level', () => {
      expect(
        emailSegmentOf(
          {
            email: 'NW-1@Placeholder.neuewege.ch',
            emailQuality: { level: 'active' },
          },
          patterns
        )
      ).toBe(MailEmailSegment.placeholder);
    });
  });
});

describe('audience filtering by mail history', () => {
  const days = (offset: number) =>
    new Date(Date.now() + offset * 24 * 60 * 60 * 1000);

  const userWhereFor = async (audience: any) => {
    const prisma = { user: { count: vi.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.user.count as Mock).mock.calls[0][0]?.where;
  };

  const subscriptionWhereFor = async (audience: any) => {
    const prisma = { subscription: { count: vi.fn(async () => 0) } };
    await makeService(prisma).count(audience);

    return (prisma.subscription.count as Mock).mock.calls[0][0].where;
  };

  const invoiceMail = (overrides: Record<string, any> = {}) => ({
    mailTemplateId: 'invoice',
    state: 'delivered',
    channel: 'mail',
    sentDate: days(-3),
    ...overrides,
  });

  const person = (mailSent: any[]) => ({ mailSent });

  const condition = (overrides: Record<string, any> = {}) => ({
    mailTemplateId: 'invoice',
    ...overrides,
  });

  const included = async (row: any, mailHistory: any) =>
    matches(
      row,
      await userWhereFor({ base: MailRecipientBase.allUsers, mailHistory })
    );

  it('keeps the people who were sent the template', async () => {
    const history = { conditions: [condition()] };

    expect(await included(person([invoiceMail()]), history)).toBe(true);
    expect(
      await included(
        person([invoiceMail({ mailTemplateId: 'other' })]),
        history
      )
    ).toBe(false);
    expect(await included(person([]), history)).toBe(false);
  });

  it('keeps the people who were not sent it, including people without any mail', async () => {
    // The point of `none` over `NOT`: a person with no log at all must stay.
    const history = { conditions: [condition({ negate: true })] };

    expect(await included(person([]), history)).toBe(true);
    expect(
      await included(
        person([invoiceMail({ mailTemplateId: 'other' })]),
        history
      )
    ).toBe(true);
    expect(await included(person([invoiceMail()]), history)).toBe(false);
  });

  it('narrows to the given delivery states, any state when none are given', async () => {
    const bounced = { conditions: [condition({ states: ['bounced'] })] };

    expect(await included(person([invoiceMail()]), bounced)).toBe(false);
    expect(
      await included(person([invoiceMail({ state: 'bounced' })]), bounced)
    ).toBe(true);
    expect(
      await included(person([invoiceMail()]), {
        conditions: [condition({ states: [] })],
      })
    ).toBe(true);
  });

  it('narrows to the given channel', async () => {
    const printed = { conditions: [condition({ channel: 'letter' })] };

    expect(await included(person([invoiceMail()]), printed)).toBe(false);
    expect(
      await included(person([invoiceMail({ channel: 'letter' })]), printed)
    ).toBe(true);
  });

  it('bounds the send date on either side, inclusively, from iso strings too', async () => {
    const lastWeek = {
      conditions: [
        condition({
          from: days(-7).toISOString(),
          to: days(-1).toISOString(),
        }),
      ],
    };

    expect(await included(person([invoiceMail()]), lastWeek)).toBe(true);
    expect(
      await included(person([invoiceMail({ sentDate: days(-10) })]), lastWeek)
    ).toBe(false);
    expect(
      await included(person([invoiceMail({ sentDate: days(-10) })]), {
        conditions: [condition({ to: days(-1) })],
      })
    ).toBe(true);
  });

  it('requires every condition by default and one of them with any', async () => {
    const both = [condition(), condition({ mailTemplateId: 'reminder' })];
    const onlyInvoice = person([invoiceMail()]);

    expect(await included(onlyInvoice, { conditions: both })).toBe(false);
    expect(
      await included(onlyInvoice, {
        match: MailHistoryMatch.all,
        conditions: both,
      })
    ).toBe(false);
    expect(
      await included(onlyInvoice, {
        match: MailHistoryMatch.any,
        conditions: both,
      })
    ).toBe(true);
  });

  it('lets any mix a sent and a not-sent condition', async () => {
    const history = {
      match: MailHistoryMatch.any,
      conditions: [
        condition({ mailTemplateId: 'reminder' }),
        condition({ mailTemplateId: 'invoice', negate: true }),
      ],
    };

    // Never got the invoice: in. Got the invoice but also the reminder: in.
    expect(await included(person([]), history)).toBe(true);
    expect(
      await included(
        person([invoiceMail(), invoiceMail({ mailTemplateId: 'reminder' })]),
        history
      )
    ).toBe(true);
    // Got only the invoice: out.
    expect(await included(person([invoiceMail()]), history)).toBe(false);
  });

  it('adds nothing for an empty list of conditions', async () => {
    const prisma = { user: { count: vi.fn(async () => 0) } };

    await makeService(prisma).count({
      base: MailRecipientBase.allUsers,
      mailHistory: { conditions: [] },
    });

    expect((prisma.user.count as Mock).mock.calls[0][0]).toBeUndefined();
  });

  it('combines with the email segments', async () => {
    const prisma = {
      user: { count: vi.fn(async () => 0) },
      settingLetterProvider: { findMany: vi.fn(async () => []) },
    };

    await makeService(prisma).count({
      base: MailRecipientBase.allUsers,
      emailSegments: [MailEmailSegment.dead],
      mailHistory: { conditions: [condition()] },
    });

    const where = (prisma.user.count as Mock).mock.calls[0][0].where;

    expect(JSON.stringify(where)).toContain('"mailSent"');
    expect(JSON.stringify(where)).toContain('"emailQuality"');
  });

  it('applies to the owner for the subscription audiences', async () => {
    const where = await subscriptionWhereFor({
      base: MailRecipientBase.hasSubscription,
      mailHistory: { conditions: [condition()] },
    });
    const owner = (mailSent: any[]) => ({
      confirmed: true,
      deactivation: null,
      paidUntil: days(20),
      user: { mailSent },
    });

    expect(matches(owner([invoiceMail()]), where)).toBe(true);
    expect(matches(owner([]), where)).toBe(false);
  });

  it('applies to the people without an active subscription too', async () => {
    const where = await userWhereFor({
      base: MailRecipientBase.noActiveSubscription,
      mailHistory: { conditions: [condition({ negate: true })] },
    });

    expect(matches({ subscriptions: [], mailSent: [] }, where)).toBe(true);
    expect(
      matches({ subscriptions: [], mailSent: [invoiceMail()] }, where)
    ).toBe(false);
  });
});
