import {
  ArticleAccessSource,
  FullArticleAccessFragment,
  FullPaywallFragment,
} from '@wepublish/website/api';
import { decideShowPaywall } from './show-paywall.context';

const paywall = (overrides: Partial<FullPaywallFragment> = {}) =>
  ({
    __typename: 'Paywall',
    id: 'paywall',
    active: true,
    anyMemberPlan: false,
    enforced: true,
    hideContentAfter: 2,
    fadeout: true,
    memberPlans: [{ id: 'premium', name: 'Premium', tags: [] }],
    bypasses: [],
    ...overrides,
  }) as FullPaywallFragment;

const access = (
  overrides: Partial<FullArticleAccessFragment> = {}
): FullArticleAccessFragment => ({
  __typename: 'ArticleAccess',
  granted: true,
  source: null,
  requirement: null,
  previewBlocks: null,
  paywallId: null,
  ruleId: null,
  stageId: null,
  ...overrides,
});

const decide = (
  overrides: Partial<Parameters<typeof decideShowPaywall>[0]> = {}
) =>
  decideShowPaywall({
    paywall: paywall(),
    memberPlanIds: [],
    canGetArticle: false,
    hasBypass: () => false,
    ctx: {},
    ...overrides,
  });

const shown = { showPaywall: true, hideContent: true };
const hidden = { showPaywall: false, hideContent: false };

describe('decideShowPaywall', () => {
  it('follows the server once it decided about an enforced paywall', () => {
    expect(decide({ serverAccess: access() })).toEqual(hidden);
    expect(
      decide({
        memberPlanIds: ['premium'],
        serverAccess: access({
          granted: false,
          source: ArticleAccessSource.Paywall,
          previewBlocks: 2,
        }),
      })
    ).toEqual(shown);
  });

  it('leaves the article to a metered restriction', () => {
    expect(
      decide({
        serverAccess: access({
          granted: false,
          source: ArticleAccessSource.EngagementRule,
        }),
      })
    ).toEqual(hidden);
  });

  it('decides as before until the server answered', () => {
    expect(decide()).toEqual(shown);
    expect(decide({ memberPlanIds: ['premium'] })).toEqual(hidden);
  });

  it('decides as before for a paywall that is not enforced', () => {
    expect(
      decide({ paywall: paywall({ enforced: false }), serverAccess: access() })
    ).toEqual(shown);
    expect(
      decide({
        paywall: paywall({ enforced: false }),
        memberPlanIds: ['premium'],
      })
    ).toEqual(hidden);
  });

  it('keeps the overrides of the show paywall context', () => {
    expect(
      decide({ serverAccess: access(), ctx: { showPaywall: true } })
    ).toEqual({ showPaywall: true, hideContent: false });
  });

  it('shows nothing for an inactive paywall', () => {
    expect(decide({ paywall: paywall({ active: false }) })).toEqual(hidden);
  });
});
