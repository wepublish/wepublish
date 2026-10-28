import {
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
} from '@prisma/client';
import {
  EngagementTarget,
  EvaluatedRule,
  EvaluatedStage,
  currentStage,
  matchingRules,
  maxMeterWindowDays,
  meteredAccess,
  resolvePrompts,
} from './evaluate';
import { Meter, emptyMeter, recordRead, toMinute } from './meter';
import { ReaderContext } from './reader-context';

const now = new Date('2026-10-26T12:00:00Z');

const stage = (
  id: string,
  afterArticles: number,
  overrides: Partial<EvaluatedStage> = {}
): EvaluatedStage => ({
  id,
  afterArticles,
  placement: EngagementPlacement.MODAL,
  enforcement: EngagementEnforcement.SOFT,
  requirement: null,
  previewBlocks: null,
  ...overrides,
});

const hardStage = (
  id: string,
  afterArticles: number,
  requirement: EngagementRequirement = EngagementRequirement.REGISTRATION
) =>
  stage(id, afterArticles, {
    placement: EngagementPlacement.CUTOFF,
    enforcement: EngagementEnforcement.HARD,
    requirement,
    previewBlocks: 3,
  });

const rule = (overrides: Partial<EvaluatedRule> = {}): EvaluatedRule => ({
  id: 'metered',
  goal: EngagementGoal.NEWSLETTER,
  active: true,
  priority: 0,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: 30,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [{ key: 'utm_medium', value: 'email' }],
  stages: [stage('soft', 2), hardStage('hard', 4)],
  ...overrides,
});

const announcement = (overrides: Partial<EvaluatedRule> = {}) =>
  rule({
    id: 'announcement',
    goal: EngagementGoal.ANNOUNCEMENT,
    meterWindowDays: null,
    stages: [stage('banner', 0, { placement: EngagementPlacement.BANNER })],
    ...overrides,
  });

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
  paying: false,
  newsletter: 'unknown',
  ...overrides,
});

const anonymous = reader();
const registered = reader({ kind: 'user', loggedIn: true, userId: 'u' });
const member = reader({
  kind: 'user',
  loggedIn: true,
  userId: 'u',
  activeMemberPlanIds: ['plan'],
});

const article = (
  articleId = 'article',
  overrides: Partial<Extract<EngagementTarget, { kind: 'article' }>> = {}
): EngagementTarget => ({
  kind: 'article',
  articleId,
  contentGateDisabled: false,
  peered: false,
  ...overrides,
});

const meterOf = (...articleIds: string[]): Meter =>
  articleIds.reduce(
    (meter, id) => recordRead(meter, id, now, { maxWindowDays: 30 }),
    emptyMeter()
  );

const ids = (rules: EvaluatedRule[]) => rules.map(({ id }) => id);

describe('matchingRules', () => {
  it('only matches active rules', () => {
    expect(
      ids(matchingRules([rule({ active: false })], anonymous, article()))
    ).toEqual([]);
  });

  it.each([
    [EngagementAudience.ANONYMOUS, ['anonymous']],
    [EngagementAudience.REGISTERED, ['registered', 'member']],
    [EngagementAudience.NON_MEMBERS, ['anonymous', 'registered']],
    [EngagementAudience.MEMBERS, ['member']],
  ])('matches %s to %j', (audience, expected) => {
    const readers = { anonymous, registered, member };
    const announcementFor = announcement({ audience });

    expect(
      Object.entries(readers)
        .filter(
          ([, r]) => matchingRules([announcementFor], r, article()).length
        )
        .map(([name]) => name)
    ).toEqual(expected);
  });

  it('matches subscribers of the chosen plans', () => {
    const forPlan = announcement({
      audience: EngagementAudience.MEMBER_PLANS,
      audienceMemberPlanIds: ['plan'],
    });
    const forOtherPlan = announcement({
      id: 'other',
      audience: EngagementAudience.MEMBER_PLANS,
      audienceMemberPlanIds: ['other-plan'],
    });

    expect(
      ids(matchingRules([forPlan, forOtherPlan], member, article()))
    ).toEqual(['announcement']);
    expect(ids(matchingRules([forPlan], registered, article()))).toEqual([]);
  });

  it('skips a rule whose hard requirement the reader already meets', () => {
    expect(ids(matchingRules([rule()], registered, article()))).toEqual([]);
    expect(
      ids(
        matchingRules(
          [
            rule({
              stages: [hardStage('hard', 4, EngagementRequirement.MEMBERSHIP)],
            }),
          ],
          registered,
          article()
        )
      )
    ).toEqual(['metered']);
  });

  it('leaves articles excluded from metered rules to announcements', () => {
    expect(
      ids(
        matchingRules(
          [rule(), announcement()],
          anonymous,
          article('a', { contentGateDisabled: true })
        )
      )
    ).toEqual(['announcement']);
  });

  it('only meters peered articles when the rule includes them', () => {
    const peered = article('a', { peered: true });

    expect(ids(matchingRules([rule()], anonymous, peered))).toEqual([]);
    expect(
      ids(
        matchingRules(
          [rule({ includePeeredArticles: true })],
          anonymous,
          peered
        )
      )
    ).toEqual(['metered']);
  });

  it('targets articles and the selected pages', () => {
    const onPage = announcement({
      showOnArticles: false,
      showOnPageIds: ['page-1'],
    });

    expect(ids(matchingRules([onPage], anonymous, article()))).toEqual([]);
    expect(
      ids(
        matchingRules([onPage], anonymous, { kind: 'page', pageId: 'page-1' })
      )
    ).toEqual(['announcement']);
    expect(
      ids(
        matchingRules([onPage], anonymous, { kind: 'page', pageId: 'page-2' })
      )
    ).toEqual([]);
  });
});

describe('currentStage', () => {
  it('is the last stage the reader has reached', () => {
    const metered = rule();

    expect(currentStage(metered, 0)).toBeUndefined();
    expect(currentStage(metered, 1)).toBeUndefined();
    expect(currentStage(metered, 2)?.id).toBe('soft');
    expect(currentStage(metered, 3)?.id).toBe('soft');
    expect(currentStage(metered, 4)?.id).toBe('hard');
    expect(currentStage(metered, 99)?.id).toBe('hard');
  });
});

describe('maxMeterWindowDays', () => {
  it('is the longest window of the metered rules', () => {
    expect(
      maxMeterWindowDays([
        rule({ meterWindowDays: 7 }),
        rule({ meterWindowDays: 90 }),
        announcement(),
      ])
    ).toBe(90);
    expect(maxMeterWindowDays([announcement()])).toBe(0);
  });
});

describe('meteredAccess', () => {
  it('restricts every hard stage when the reader has no meter', () => {
    expect(meteredAccess({ rules: [rule()], articleId: 'a', now })).toEqual({
      granted: false,
      ruleId: 'metered',
      stageId: 'hard',
      requirement: EngagementRequirement.REGISTRATION,
      previewBlocks: 3,
    });
  });

  it('grants articles without a hard stage', () => {
    expect(
      meteredAccess({
        rules: [rule({ stages: [stage('soft', 2)] }), announcement()],
        articleId: 'a',
        now,
      })
    ).toEqual({ granted: true, record: true, referral: false });

    expect(
      meteredAccess({ rules: [announcement()], articleId: 'a', now })
    ).toEqual({ granted: true, record: false, referral: false });
  });

  describe('Scenario A: soft, then hard, at the configured thresholds', () => {
    it('grants the first four articles and restricts the fifth', () => {
      const results = ['a1', 'a2', 'a3', 'a4', 'a5'].map((articleId, index) =>
        meteredAccess({
          rules: [rule()],
          meter: meterOf(...['a1', 'a2', 'a3', 'a4'].slice(0, index)),
          articleId,
          now,
        })
      );

      expect(results.map(result => result.granted)).toEqual([
        true,
        true,
        true,
        true,
        false,
      ]);
    });

    it('shows nothing for two articles, the modal for two, then the cutoff', () => {
      const shown = ['a1', 'a2', 'a3', 'a4', 'a5'].map((articleId, index) => {
        const meter = meterOf(...['a1', 'a2', 'a3', 'a4'].slice(0, index));
        const access = meteredAccess({
          rules: [rule()],
          meter,
          articleId,
          now,
        });

        return resolvePrompts({
          rules: [rule()],
          meter,
          articleId,
          now,
          restriction: access.granted ? undefined : access,
        }).map(({ stage }) => stage.id);
      });

      expect(shown).toEqual([[], [], ['soft'], ['soft'], ['hard']]);
    });

    it('follows other thresholds just the same', () => {
      const custom = rule({
        stages: [stage('soft', 0), hardStage('hard', 1)],
      });

      expect(
        meteredAccess({
          rules: [custom],
          meter: meterOf(),
          articleId: 'a',
          now,
        }).granted
      ).toBe(true);
      expect(
        meteredAccess({
          rules: [custom],
          meter: meterOf('a'),
          articleId: 'b',
          now,
        }).granted
      ).toBe(false);
    });
  });

  it('grants an article read again within the window', () => {
    expect(
      meteredAccess({
        rules: [rule()],
        meter: meterOf('a1', 'a2', 'a3', 'a4'),
        articleId: 'a2',
        now,
      }).granted
    ).toBe(true);
  });

  it('forgets reads that left the window', () => {
    const old: Meter = {
      reads: ['a1', 'a2', 'a3', 'a4'].map(id => [
        id,
        toMinute(now) - 31 * 24 * 60,
      ]),
    };

    expect(
      meteredAccess({ rules: [rule()], meter: old, articleId: 'a5', now })
        .granted
    ).toBe(true);
  });

  describe('Scenario D: newsletter referrals', () => {
    const fromNewsletter = [{ key: 'utm_medium', value: 'email' }];
    const full = meterOf('a1', 'a2', 'a3', 'a4');

    it('never opens an article without a referral setting', () => {
      expect(
        meteredAccess({
          rules: [rule()],
          meter: full,
          articleId: 'a5',
          referral: fromNewsletter,
          now,
        }).granted
      ).toBe(false);
    });

    it('always opens the linked article with unlimited referrals', () => {
      expect(
        meteredAccess({
          rules: [
            rule({ newsletterReferral: NewsletterReferralMode.UNLIMITED }),
          ],
          meter: full,
          articleId: 'a5',
          referral: fromNewsletter,
          now,
        })
      ).toEqual({ granted: true, record: true, referral: true });
    });

    it('opens as many linked articles as the limit allows', () => {
      const limited = rule({
        newsletterReferral: NewsletterReferralMode.LIMITED,
        newsletterReferralLimit: 1,
      });
      const first = meteredAccess({
        rules: [limited],
        meter: full,
        articleId: 'a5',
        referral: fromNewsletter,
        now,
      });

      expect(first).toEqual({ granted: true, record: true, referral: true });

      const afterFirst = recordRead(full, 'a5', now, {
        maxWindowDays: 30,
        referral: true,
      });

      expect(
        meteredAccess({
          rules: [limited],
          meter: afterFirst,
          articleId: 'a6',
          referral: fromNewsletter,
          now,
        }).granted
      ).toBe(false);
    });

    it('does not count referral reads towards the meter', () => {
      const meter = recordRead(meterOf('a1', 'a2', 'a3'), 'n1', now, {
        maxWindowDays: 30,
        referral: true,
      });

      expect(
        meteredAccess({ rules: [rule()], meter, articleId: 'a4', now }).granted
      ).toBe(true);
    });

    it('ignores params the rule does not list', () => {
      expect(
        meteredAccess({
          rules: [
            rule({ newsletterReferral: NewsletterReferralMode.UNLIMITED }),
          ],
          meter: full,
          articleId: 'a5',
          referral: [{ key: 'utm_medium', value: 'social' }],
          now,
        }).granted
      ).toBe(false);
    });

    it('accepts any value for a param listed without one', () => {
      expect(
        meteredAccess({
          rules: [
            rule({
              newsletterReferral: NewsletterReferralMode.UNLIMITED,
              newsletterParams: [{ key: 'mc_cid', value: '' }],
            }),
          ],
          meter: full,
          articleId: 'a5',
          referral: [{ key: 'mc_cid', value: 'abc' }],
          now,
        }).granted
      ).toBe(true);
    });
  });

  it('restricts by the first rule that restricts, in prompt order', () => {
    const low = rule({ id: 'low', priority: 0 });
    const high = rule({
      id: 'high',
      priority: 5,
      stages: [hardStage('high-hard', 1, EngagementRequirement.MEMBERSHIP)],
    });

    expect(
      meteredAccess({
        rules: [low, high],
        meter: meterOf('a1', 'a2', 'a3', 'a4'),
        articleId: 'a5',
        now,
      })
    ).toMatchObject({ granted: false, ruleId: 'high', stageId: 'high-hard' });
  });
});

describe('resolvePrompts', () => {
  it('orders by priority, hard before soft, then id', () => {
    const rules = [
      announcement({ id: 'b', priority: 1 }),
      announcement({ id: 'a', priority: 1 }),
      rule({ id: 'hard', priority: 1, stages: [hardStage('h', 0)] }),
      announcement({ id: 'top', priority: 9 }),
    ];

    expect(
      resolvePrompts({
        rules,
        articleId: 'x',
        now,
        restriction: { ruleId: 'hard', stageId: 'h' },
      }).map(({ rule }) => rule.id)
    ).toEqual(['top', 'hard', 'a', 'b']);
  });

  it('falls back to the soft stage when the hard one does not restrict', () => {
    expect(
      resolvePrompts({
        rules: [rule()],
        meter: meterOf('a1', 'a2', 'a3', 'a4', 'a5'),
        articleId: 'a2',
        now,
      }).map(({ stage }) => stage.id)
    ).toEqual(['soft']);
  });

  it('shows no hard stage on pages', () => {
    expect(
      resolvePrompts({
        rules: [rule({ stages: [stage('soft', 0), hardStage('hard', 0)] })],
        now,
      }).map(({ stage }) => stage.id)
    ).toEqual(['soft']);
  });
});
