import { EngagementRequirement } from '@prisma/client';
import { MeteredAccess, ReaderContext } from '@wepublish/engagement/api';
import {
  AccessPaywall,
  ArticleAccessSource,
  evaluateArticleAccess,
} from './article-access';

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
const memberOf = (...activeMemberPlanIds: string[]) =>
  reader({
    kind: 'user',
    loggedIn: true,
    userId: 'u',
    activeMemberPlanIds,
    paying: true,
  });

const paywall = (overrides: Partial<AccessPaywall> = {}): AccessPaywall => ({
  id: 'paywall',
  active: true,
  enforced: true,
  anyMemberPlan: false,
  hideContentAfter: 2,
  memberPlanIds: ['premium'],
  bypassTokens: ['secret'],
  ...overrides,
});

const meteredGranted: MeteredAccess = {
  granted: true,
  record: true,
  referral: false,
};

const meteredRestricted: MeteredAccess = {
  granted: false,
  ruleId: 'rule',
  stageId: 'hard',
  requirement: EngagementRequirement.REGISTRATION,
  previewBlocks: 3,
};

const paywallRestriction = {
  granted: false,
  source: ArticleAccessSource.PAYWALL,
  paywallId: 'paywall',
  requirement: EngagementRequirement.MEMBERSHIP,
  previewBlocks: 2,
};

describe('evaluateArticleAccess', () => {
  describe('Scenario B: an enforced paywall decides alone', () => {
    it('shows anonymous readers the preview, even when the meter would allow more', () => {
      expect(
        evaluateArticleAccess({
          reader: anonymous,
          paywall: paywall(),
          metered: meteredGranted,
        })
      ).toEqual(paywallRestriction);
    });

    it('ignores newsletter referrals', () => {
      expect(
        evaluateArticleAccess({
          reader: anonymous,
          paywall: paywall(),
          metered: { granted: true, record: true, referral: true },
        })
      ).toEqual(paywallRestriction);
    });

    it('lets members of a listed plan read', () => {
      expect(
        evaluateArticleAccess({
          reader: memberOf('premium'),
          paywall: paywall(),
          metered: meteredRestricted,
        })
      ).toEqual({ granted: true });
    });

    it('keeps members of other plans out', () => {
      expect(
        evaluateArticleAccess({
          reader: memberOf('basic'),
          paywall: paywall(),
          metered: meteredGranted,
        })
      ).toEqual(paywallRestriction);
    });

    it('lets members of any plan read when the paywall takes any plan', () => {
      expect(
        evaluateArticleAccess({
          reader: memberOf('basic'),
          paywall: paywall({ anyMemberPlan: true, memberPlanIds: [] }),
          metered: meteredGranted,
        })
      ).toEqual({ granted: true });

      expect(
        evaluateArticleAccess({
          reader: anonymous,
          paywall: paywall({ anyMemberPlan: true, memberPlanIds: [] }),
          metered: meteredGranted,
        }).granted
      ).toBe(false);
    });

    it('lets readers with a valid bypass token read', () => {
      expect(
        evaluateArticleAccess({
          reader: anonymous,
          paywall: paywall(),
          metered: meteredRestricted,
          bypassToken: 'secret',
        })
      ).toEqual({ granted: true });

      expect(
        evaluateArticleAccess({
          reader: anonymous,
          paywall: paywall(),
          metered: meteredGranted,
          bypassToken: 'guessed',
        })
      ).toEqual(paywallRestriction);
    });
  });

  it('grants a paywall that is not enforced and leaves hiding to the website', () => {
    expect(
      evaluateArticleAccess({
        reader: anonymous,
        paywall: paywall({ enforced: false }),
        metered: meteredRestricted,
      })
    ).toEqual({ granted: true });
  });

  it('leaves an inactive paywall to the metered rules', () => {
    expect(
      evaluateArticleAccess({
        reader: anonymous,
        paywall: paywall({ active: false }),
        metered: meteredRestricted,
      })
    ).toEqual({
      granted: false,
      source: ArticleAccessSource.ENGAGEMENT_RULE,
      ruleId: 'rule',
      stageId: 'hard',
      requirement: EngagementRequirement.REGISTRATION,
      previewBlocks: 3,
    });
  });

  it('lets the metered rules decide without a paywall', () => {
    expect(
      evaluateArticleAccess({ reader: anonymous, metered: meteredGranted })
    ).toEqual({ granted: true });
    expect(
      evaluateArticleAccess({ reader: anonymous, metered: meteredRestricted })
        .granted
    ).toBe(false);
  });

  it.each([
    ['editors', reader({ kind: 'user', loggedIn: true, privileged: true })],
    ['previews', reader({ kind: 'user', loggedIn: true, privileged: true })],
    ['peers', reader({ kind: 'peer', privileged: true })],
    [
      'api tokens that may read articles',
      reader({ kind: 'apiToken', privileged: true }),
    ],
  ])('lets %s read everything', (_, privileged) => {
    expect(
      evaluateArticleAccess({
        reader: privileged,
        paywall: paywall(),
        metered: meteredRestricted,
      })
    ).toEqual({ granted: true });
  });

  it('treats an api token without the permission like an anonymous reader', () => {
    expect(
      evaluateArticleAccess({
        reader: reader({ kind: 'apiToken' }),
        paywall: paywall(),
        metered: meteredGranted,
      })
    ).toEqual(paywallRestriction);
  });
});
