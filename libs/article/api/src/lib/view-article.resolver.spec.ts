import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@prisma/client';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
  METER_SECRET,
  ENGAGEMENT_SHARED_NAMESPACES,
  MeterService,
  ReaderContext,
  deriveMeterSecret,
  signMeter,
} from '@wepublish/engagement/api';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { ArticleAccessService, ArticleRequest } from './article-access.service';
import { ArticleAccessSource } from './article-access';
import { ArticleRevisionResolver } from './article-revision.resolver';
import { ViewArticleResolver } from './view-article.resolver';

const secret = deriveMeterSecret('key');

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
  newsletter: 'unknown',
  ...overrides,
});

const stage = (
  id: string,
  overrides: Partial<EngagementStageWithActions>
): EngagementStageWithActions => ({
  id,
  ruleId: 'rule',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  afterArticles: 0,
  placement: EngagementPlacement.MODAL,
  enforcement: EngagementEnforcement.SOFT,
  requirement: null,
  previewBlocks: null,
  dismissible: true,
  hideForMinutes: 1440,
  delaySeconds: 0,
  title: null,
  text: null,
  cta: null,
  description: null,
  html: null,
  embedUrl: null,
  imageId: null,
  actions: [],
  ...overrides,
});

const meteredRule = (
  requirement: EngagementRequirement = EngagementRequirement.REGISTRATION,
  overrides: Partial<EngagementRuleWithStages> = {}
): EngagementRuleWithStages => ({
  id: 'rule',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Grow newsletter',
  goal: EngagementGoal.NEWSLETTER,
  active: true,
  priority: 0,
  version: 2,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: 30,
  stages: [
    stage('soft', { afterArticles: 2 }),
    stage('hard', {
      afterArticles: 4,
      placement: EngagementPlacement.CUTOFF,
      enforcement: EngagementEnforcement.HARD,
      requirement,
      previewBlocks: 1,
      dismissible: false,
    }),
  ],
  ...overrides,
});

describe('viewArticle', () => {
  let currentReader: ReaderContext;
  let paywall: Record<string, unknown> | null;
  let rules: EngagementRuleWithStages[];
  let meters: MeterService;
  let kv: NamespacedCache;
  let bypassTokens: string[];

  const articleOf = (id: string) => ({
    id,
    paywallId: paywall ? 'paywall' : null,
    contentGateDisabled: false,
    peerId: null,
  });

  const accessService = () =>
    new ArticleAccessService(
      {
        load: async (id: string) => (id === 'missing' ? null : articleOf(id)),
      } as never,
      { load: async () => paywall } as never,
      { load: async () => [{ id: 'premium' }] } as never,
      {
        getPaywallBypasses: async () => bypassTokens.map(token => ({ token })),
      } as never,
      {
        forRequest: async () => currentReader,
        isPaywallBypassToken: async (token?: string) =>
          !!token && bypassTokens.includes(token),
      } as never,
      { getActiveRules: async () => rules } as never,
      meters,
      {
        statusOf: (token?: string) =>
          token === 'signed-up' ? 'subscribed' : undefined,
      } as never
    );

  /** One request: viewArticle, then the blocks of the article it answered. */
  const visit = async (
    articleId: string,
    input: Partial<{
      meterToken: string | null;
      paywallBypassToken: string;
      newsletterToken: string;
    }> = {}
  ) => {
    const req: ArticleRequest = { headers: {} };
    const access = accessService();
    const view = await new ViewArticleResolver(access).viewArticle(
      { articleId, ...input } as never,
      req,
      undefined
    );
    const blocks = await new ArticleRevisionResolver(
      {
        loadBlocks: async (b: unknown[]) => b,
        nextChange: async () => null,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      access
    ).blocks(
      { articleId, blocks: ['b1', 'b2', 'b3'] } as never,
      true,
      { req },
      undefined
    );

    return { ...view, blocks };
  };

  beforeEach(async () => {
    currentReader = reader();
    paywall = null;
    rules = [meteredRule()];
    bypassTokens = ['secret'];

    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: ENGAGEMENT_SHARED_NAMESPACES,
        }),
      ],
      providers: [MeterService, { provide: METER_SECRET, useValue: secret }],
    }).compile();

    await module.init();
    meters = module.get(MeterService);
    kv = module.get(NamespacedCache);
  });

  it('meters an anonymous reader through the token: two clean, two modals, then the cutoff', async () => {
    let meterToken: string | null | undefined;
    const seen = [];

    for (const articleId of ['a1', 'a2', 'a3', 'a4', 'a5']) {
      const view = await visit(articleId, { meterToken });
      meterToken = view.meterToken;
      seen.push({
        granted: view.access.granted,
        prompts: view.prompts.map(({ stage }) => stage.id),
        blocks: view.blocks.length,
      });
    }

    expect(seen).toEqual([
      { granted: true, prompts: [], blocks: 3 },
      { granted: true, prompts: [], blocks: 3 },
      { granted: true, prompts: ['soft'], blocks: 3 },
      { granted: true, prompts: ['soft'], blocks: 3 },
      { granted: false, prompts: ['hard'], blocks: 1 },
    ]);
  });

  it('answers who restricts the article and with what preview', async () => {
    const meterToken = signMeter(
      {
        reads: ['a1', 'a2', 'a3', 'a4'].map(id => [
          id,
          (Date.now() / 60_000) | 0,
        ]),
      },
      secret
    );

    expect((await visit('a5', { meterToken })).access).toEqual({
      granted: false,
      source: ArticleAccessSource.ENGAGEMENT_RULE,
      ruleId: 'rule',
      stageId: 'hard',
      requirement: EngagementRequirement.REGISTRATION,
      previewBlocks: 1,
    });
  });

  it('counts a forged token as an empty meter', async () => {
    const forged = signMeter(
      { reads: ['a1', 'a2', 'a3', 'a4'].map(id => [id, 0]) },
      deriveMeterSecret('not the key')
    );

    const view = await visit('a5', { meterToken: forged });

    expect(view.access.granted).toBe(true);
    expect(await meters.load(currentReader, view.meterToken)).toEqual({
      reads: [['a5', expect.any(Number)]],
    });
  });

  it("keeps a logged-in reader's meter on the server, so dropping the token resets nothing", async () => {
    rules = [meteredRule(EngagementRequirement.MEMBERSHIP)];
    currentReader = reader({ kind: 'user', loggedIn: true, userId: 'user-1' });
    const setNs = vi.spyOn(kv, 'setNs');

    for (const articleId of ['a1', 'a2', 'a3', 'a4']) {
      expect((await visit(articleId)).meterToken).toBeNull();
    }

    const fifth = await visit('a5', { meterToken: null });

    expect(fifth.access.granted).toBe(false);
    expect(fifth.blocks).toEqual(['b1']);
    expect(setNs).toHaveBeenCalledTimes(4);
  });

  it('lets a reader past a newsletter wall once they signed up', async () => {
    rules = [
      meteredRule(EngagementRequirement.NEWSLETTER, {
        goal: EngagementGoal.MEMBERSHIP,
      }),
    ];
    const meterToken = signMeter(
      {
        reads: ['a1', 'a2', 'a3', 'a4'].map(id => [
          id,
          (Date.now() / 60_000) | 0,
        ]),
      },
      secret
    );

    const walled = await visit('a5', { meterToken });
    const signedUp = await visit('a5', {
      meterToken,
      newsletterToken: 'signed-up',
    });
    const madeUp = await visit('a5', { meterToken, newsletterToken: 'guess' });

    expect(walled.access.requirement).toBe(EngagementRequirement.NEWSLETTER);
    expect(walled.blocks).toHaveLength(1);
    expect(signedUp.access.granted).toBe(true);
    expect(signedUp.blocks).toHaveLength(3);
    expect(madeUp.blocks).toHaveLength(1);
  });

  describe('enforced paywall', () => {
    beforeEach(() => {
      rules = [];
      paywall = {
        id: 'paywall',
        active: true,
        enforced: true,
        anyMemberPlan: false,
        hideContentAfter: 2,
      };
    });

    it('only sends the preview to readers without a membership', async () => {
      const view = await visit('p1');

      expect(view.access).toMatchObject({
        granted: false,
        source: ArticleAccessSource.PAYWALL,
        previewBlocks: 2,
      });
      expect(view.blocks).toEqual(['b1', 'b2']);
    });

    it('sends every block to members of its plans', async () => {
      currentReader = reader({
        kind: 'user',
        loggedIn: true,
        userId: 'u',
        activeMemberPlanIds: ['premium'],
      });

      expect((await visit('p1')).blocks).toHaveLength(3);
    });

    it('sends every block with a valid bypass token', async () => {
      expect(
        (await visit('p1', { paywallBypassToken: 'secret' })).blocks
      ).toHaveLength(3);
      expect(
        (await visit('p1', { paywallBypassToken: 'guess' })).blocks
      ).toHaveLength(2);
    });
  });

  it('lets privileged readers read without touching their meter', async () => {
    currentReader = reader({ kind: 'apiToken', privileged: true });
    const meterToken = signMeter(
      {
        reads: ['a1', 'a2', 'a3', 'a4'].map(id => [
          id,
          (Date.now() / 60_000) | 0,
        ]),
      },
      secret
    );

    const view = await visit('a5', { meterToken });

    expect(view.access.granted).toBe(true);
    expect(view.meterToken).toBeNull();
    expect(view.blocks).toHaveLength(3);
  });

  it('fails for an unknown article', async () => {
    await expect(visit('missing')).rejects.toThrow(NotFoundException);
  });
});
