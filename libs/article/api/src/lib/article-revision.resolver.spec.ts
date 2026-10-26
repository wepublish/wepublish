import type { Mock } from 'vitest';
import {
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
} from '@prisma/client';
import {
  EngagementRuleWithStages,
  ReaderContext,
} from '@wepublish/engagement/api';
import { ArticleRevisionResolver } from './article-revision.resolver';
import { ArticleAccessService, ArticleRequest } from './article-access.service';

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
  paying: false,
  newsletter: 'unknown',
  ...overrides,
});

const hardMeter = (
  overrides: Partial<EngagementRuleWithStages> = {}
): EngagementRuleWithStages => ({
  id: 'rule',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Meter',
  goal: EngagementGoal.NEWSLETTER,
  active: true,
  priority: 0,
  version: 1,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: 30,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [
    {
      id: 'hard',
      ruleId: 'rule',
      createdAt: new Date('2026-01-01'),
      modifiedAt: new Date('2026-01-01'),
      afterArticles: 2,
      placement: EngagementPlacement.CUTOFF,
      enforcement: EngagementEnforcement.HARD,
      requirement: EngagementRequirement.REGISTRATION,
      previewBlocks: 1,
      dismissible: false,
      hideForMinutes: 0,
      delaySeconds: 0,
      title: null,
      text: null,
      cta: null,
      description: null,
      html: null,
      embedUrl: null,
      imageId: null,
      actions: [],
    },
  ],
  ...overrides,
});

const enforcedPaywall = {
  id: 'paywall',
  active: true,
  enforced: true,
  anyMemberPlan: false,
  hideContentAfter: 2,
};

describe('ArticleRevisionResolver blocks', () => {
  const revision = {
    id: 'revision-1',
    articleId: 'article-1',
    blocks: ['a', 'b', 'c', 'd'],
  } as never;

  let currentReader: ReaderContext;
  let article: Record<string, unknown>;
  let paywall: Record<string, unknown> | null;
  let rules: EngagementRuleWithStages[];
  let slotTeasersLoader: { loadSlotTeasersIntoBlocks: Mock };
  let access: ArticleAccessService;

  const resolver = () =>
    new ArticleRevisionResolver(
      slotTeasersLoader as never,
      {} as never,
      {} as never,
      {} as never,
      access
    );

  beforeEach(() => {
    currentReader = reader();
    article = {
      id: 'article-1',
      paywallId: null,
      contentGateDisabled: false,
      peerId: null,
    };
    paywall = null;
    rules = [];
    // Block templates expand while loading: the cut must count what is sent.
    slotTeasersLoader = {
      loadSlotTeasersIntoBlocks: vi.fn(async (blocks: string[]) =>
        blocks.flatMap(block => (block === 'a' ? ['a1', 'a2'] : [block]))
      ),
    };
    access = new ArticleAccessService(
      { load: async () => article } as never,
      { load: async () => paywall } as never,
      { load: async () => [{ id: 'premium' }] } as never,
      { getPaywallBypasses: async () => [] } as never,
      { forRequest: async () => currentReader } as never,
      { getActiveRules: async () => rules } as never,
      {} as never
    );
  });

  const blocksFor = (req: ArticleRequest = {}) =>
    resolver().blocks(revision, req, undefined);

  it('sends every block without a paywall or rule', async () => {
    expect(await blocksFor()).toEqual(['a1', 'a2', 'b', 'c', 'd']);
    expect(await resolver().restricted(revision, {}, undefined)).toBe(false);
  });

  it('only sends the preview of an enforced paywall, cut after the slots were loaded', async () => {
    article['paywallId'] = 'paywall';
    paywall = enforcedPaywall;

    expect(await blocksFor()).toEqual(['a1', 'a2']);
    expect(slotTeasersLoader.loadSlotTeasersIntoBlocks).toHaveBeenCalledWith([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(await resolver().restricted(revision, {}, undefined)).toBe(true);
  });

  it('sends every block of a paywall that is not enforced', async () => {
    article['paywallId'] = 'paywall';
    paywall = { ...enforcedPaywall, enforced: false };

    expect(await blocksFor()).toHaveLength(5);
  });

  it('only sends the preview of a hard metered stage to readers without a meter', async () => {
    rules = [hardMeter()];

    expect(await blocksFor()).toEqual(['a1']);
  });

  it('sends every block once the reader meets the requirement', async () => {
    rules = [hardMeter()];
    currentReader = reader({ kind: 'user', loggedIn: true, userId: 'u' });

    expect(await blocksFor()).toHaveLength(5);
  });

  it('sends every block once viewArticle granted the article in this request', async () => {
    article['paywallId'] = 'paywall';
    paywall = enforcedPaywall;

    expect(
      await blocksFor({ engagementGrants: new Set(['article-1']) })
    ).toHaveLength(5);
  });

  it.each([
    ['editors', reader({ kind: 'user', loggedIn: true, privileged: true })],
    ['peers and previews', reader({ kind: 'peer', privileged: true })],
  ])('sends every block to %s', async (_, privileged) => {
    article['paywallId'] = 'paywall';
    paywall = enforcedPaywall;
    rules = [hardMeter()];
    currentReader = privileged;

    expect(await blocksFor()).toHaveLength(5);
  });

  it('decides once per request and article', async () => {
    const forRequest = vi.fn(async () => currentReader);
    Object.assign(access, { readers: { forRequest } });
    const req = {};

    await blocksFor(req);
    await resolver().restricted(revision, req, undefined);

    expect(forRequest).toHaveBeenCalledTimes(1);
  });

  it('no longer takes an unlockContentGate argument', () => {
    expect(resolver().blocks.length).toBe(3);
    expect(
      Reflect.getMetadataKeys(ArticleRevisionResolver.prototype, 'blocks')
    ).not.toContain('unlockContentGate');
  });
});
