import { Test } from '@nestjs/testing';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import { CanGetArticle } from '@wepublish/permissions';
import type { UserSession } from '@wepublish/authentication/api';
import { createMock } from '@wepublish/testing';
import { BlockTreeLoader } from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { ArticleRevisionResolver } from './article-revision.resolver';
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
} from '@wepublish/author/api';
import type { ArticleRevision } from './article.model';
import type { Mock } from 'vitest';
import {
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@prisma/client';
import {
  EngagementRuleWithStages,
  ReaderContext,
} from '@wepublish/engagement/api';
import { ArticleAccessService, ArticleRequest } from './article-access.service';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
  skipAnswerCache: vi.fn(),
}));

describe('ArticleRevisionResolver', () => {
  let resolver: ArticleRevisionResolver;
  let loader: BlockTreeLoader;

  const now = new Date('2026-01-05T09:00:00Z');
  const loaded = [{ type: 'title' }];

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ArticleRevisionResolver,
        {
          provide: BlockTreeLoader,
          useValue: {
            ...createMock(BlockTreeLoader),
            now,
            loadBlocks: vi.fn(async () => loaded),
            nextChange: vi.fn(async () => null),
          },
        },
        {
          provide: ArticleAuthorDataloader,
          useValue: createMock(ArticleAuthorDataloader),
        },
        {
          provide: ArticleSocialMediaAuthorDataloader,
          useValue: createMock(ArticleSocialMediaAuthorDataloader),
        },
        {
          provide: ImageDataloaderService,
          useValue: createMock(ImageDataloaderService),
        },
        {
          provide: ArticleAccessService,
          useValue: { accessFor: vi.fn(async () => ({ granted: true })) },
        },
      ],
    }).compile();

    resolver = module.get(ArticleRevisionResolver);
    loader = module.get(BlockTreeLoader);
  });

  const revision = { blocks: [] } as unknown as ArticleRevision;

  const changesIn = (seconds: number) =>
    vi
      .mocked(loader.nextChange)
      .mockResolvedValue(new Date(now.getTime() + seconds * 1000));

  describe('blocksChangeAt', () => {
    it('asks the loader when the displayed blocks change next', async () => {
      changesIn(1800);

      expect(await resolver.blocksChangeAt(revision)).toEqual(
        new Date('2026-01-05T09:30:00Z')
      );
      expect(loader.nextChange).toHaveBeenCalledWith(revision.blocks);
    });
  });

  describe('blocks', () => {
    it('lets the answer cache expire when the blocks change next', async () => {
      changesIn(1800);
      const context = {};

      await resolver.blocks(revision, true, context, undefined);

      expect(limitAnswerCache).toHaveBeenCalledWith(
        context,
        new Date('2026-01-05T09:30:00Z')
      );
    });

    it('leaves the answer cache alone for untimed blocks', async () => {
      await resolver.blocks(revision, true, {}, undefined);

      expect(limitAnswerCache).not.toHaveBeenCalled();
    });

    const editor = {
      roles: [{ id: 'editor', permissionIDs: [CanGetArticle.id] }],
    } as unknown as UserSession;

    it('omits blocks that should not display by default', async () => {
      expect(await resolver.blocks(revision, true, {}, undefined)).toBe(loaded);
      expect(loader.loadBlocks).toHaveBeenCalledWith(revision.blocks, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).not.toHaveBeenCalled();
    });

    it('returns every block to a user allowed to edit them', async () => {
      const context = {};

      await resolver.blocks(revision, false, context, editor);

      expect(loader.loadBlocks).toHaveBeenLastCalledWith(revision.blocks, {
        onlyDisplayed: false,
      });
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });

    it('never returns hidden blocks to anyone else', async () => {
      const context = {};

      await resolver.blocks(revision, false, context, undefined);

      expect(loader.loadBlocks).toHaveBeenLastCalledWith(revision.blocks, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });
  });
});

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
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
  audiences: [],
  excludedAudiences: [],
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: 30,
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

describe('ArticleRevisionResolver access', () => {
  const revision = {
    id: 'revision-1',
    articleId: 'article-1',
    blocks: ['a', 'b', 'c', 'd'],
  } as never;

  let currentReader: ReaderContext;
  let article: Record<string, unknown>;
  let paywall: Record<string, unknown> | null;
  let rules: EngagementRuleWithStages[];
  let blockTreeLoader: { loadBlocks: Mock; nextChange: Mock };
  let access: ArticleAccessService;
  let serverMeter: { reads: [string, number][] };

  const resolver = () =>
    new ArticleRevisionResolver(
      blockTreeLoader as never,
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
    serverMeter = { reads: [] };
    // Block templates expand while loading: the cut must count what is sent.
    blockTreeLoader = {
      loadBlocks: vi.fn(async (blocks: string[]) =>
        blocks.flatMap(block => (block === 'a' ? ['a1', 'a2'] : [block]))
      ),
      nextChange: vi.fn(async () => null),
    };
    access = new ArticleAccessService(
      { load: async () => article } as never,
      { load: async () => paywall } as never,
      { load: async () => [{ id: 'premium' }] } as never,
      { getPaywallBypasses: async () => [] } as never,
      { forRequest: async () => currentReader } as never,
      { getActiveRules: async () => rules } as never,
      {
        load: async (r: ReaderContext) =>
          r.userId ? serverMeter : { reads: [] },
      } as never,
      {} as never
    );
  });

  const blocksFor = (req: ArticleRequest = {}) =>
    resolver().blocks(revision, true, { req }, undefined);

  it('sends every block without a paywall or rule', async () => {
    expect(await blocksFor()).toEqual(['a1', 'a2', 'b', 'c', 'd']);
    expect(await resolver().restricted(revision, {}, undefined)).toBe(false);
  });

  it('only sends the preview of an enforced paywall, cut after the slots were loaded', async () => {
    article['paywallId'] = 'paywall';
    paywall = enforcedPaywall;

    expect(await blocksFor()).toEqual(['a1', 'a2']);
    expect(blockTreeLoader.loadBlocks).toHaveBeenCalledWith(
      ['a', 'b', 'c', 'd'],
      { onlyDisplayed: true }
    );
    expect(await resolver().restricted(revision, {}, undefined)).toBe(true);
  });

  it('sends every block of a paywall that is not enforced', async () => {
    article['paywallId'] = 'paywall';
    paywall = { ...enforcedPaywall, enforced: false };

    expect(await blocksFor()).toHaveLength(5);
  });

  it('sends a free article in full to readers without a meter, as server rendering and feeds request it', async () => {
    rules = [hardMeter()];

    expect(await blocksFor()).toHaveLength(5);
  });

  it('only sends the preview of a stage that restricts from the first article', async () => {
    rules = [
      hardMeter({ stages: [{ ...hardMeter().stages[0], afterArticles: 0 }] }),
    ];

    expect(await blocksFor()).toEqual(['a1']);
  });

  it("counts a logged-in reader's server-side meter, so their page is cut as viewArticle cuts it", async () => {
    const minute = (Date.now() / 60_000) | 0;
    rules = [
      hardMeter({
        stages: [
          {
            ...hardMeter().stages[0],
            requirement: EngagementRequirement.MEMBERSHIP,
          },
        ],
      }),
    ];
    currentReader = reader({ kind: 'user', loggedIn: true, userId: 'u' });
    serverMeter = {
      reads: [
        ['other-1', minute],
        ['other-2', minute],
      ],
    };

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
      await blocksFor({
        engagementAccess: new Map([['article-1', { granted: true }]]),
      })
    ).toHaveLength(5);
  });

  it('sends feeds every displayed block, uncut: they apply their own paywall setting', async () => {
    article['paywallId'] = 'paywall';
    paywall = enforcedPaywall;
    rules = [
      hardMeter({ stages: [{ ...hardMeter().stages[0], afterArticles: 0 }] }),
    ];

    expect(
      await resolver().blocks(revision, true, { req: {} }, undefined, true)
    ).toHaveLength(5);
    expect(blockTreeLoader.loadBlocks).toHaveBeenLastCalledWith(
      revision.blocks,
      { onlyDisplayed: true }
    );
  });

  it('cuts the blocks viewArticle restricted in this request, meter or not', async () => {
    expect(
      await blocksFor({
        engagementAccess: new Map([
          ['article-1', { granted: false, previewBlocks: 1 } as never],
        ]),
      })
    ).toEqual(['a1']);
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
    expect(resolver().blocks.length).toBe(4);
    expect(
      Reflect.getMetadataKeys(ArticleRevisionResolver.prototype, 'blocks')
    ).not.toContain('unlockContentGate');
  });
});
