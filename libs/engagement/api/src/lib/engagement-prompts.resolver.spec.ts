import { ChallengeService } from '@wepublish/challenge/api';
import type { Mock } from 'vitest';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  PrismaClient,
} from '@prisma/client';
import { ImageDataloaderService } from '@wepublish/image/api';
import request from 'supertest';
import { EngagementPromptsResolver } from './engagement-prompts.resolver';
import {
  EngagementRuleService,
  EngagementRuleWithStages,
  EngagementStageWithActions,
} from './engagement-rule.service';
import { EngagementStageResolver } from './engagement-stage.resolver';
import { NewsletterSignupResolver } from './newsletter-signup.resolver';
import { NewsletterSignupService } from './newsletter-signup.service';
import { ReaderContextService } from './reader-context.service';
import {
  NewsletterVerifier,
  UnavailableNewsletterVerifier,
} from './newsletter-verifier';

const stage = (
  id: string,
  overrides: Partial<EngagementStageWithActions> = {}
): EngagementStageWithActions => ({
  id,
  ruleId: 'rule',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  afterArticles: 0,
  placement: EngagementPlacement.BANNER,
  enforcement: EngagementEnforcement.SOFT,
  requirement: null,
  previewBlocks: null,
  dismissible: true,
  hideForMinutes: 60,
  delaySeconds: 0,
  title: id,
  text: null,
  cta: null,
  description: null,
  html: null,
  embedUrl: null,
  imageId: null,
  actions: [],
  ...overrides,
});

const rule = (
  id: string,
  overrides: Partial<EngagementRuleWithStages> = {}
): EngagementRuleWithStages => ({
  id,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: id,
  goal: EngagementGoal.ANNOUNCEMENT,
  active: true,
  priority: 0,
  version: 3,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: ['page-1'],
  includePeeredArticles: false,
  meterWindowDays: null,
  stages: [stage(`${id}-stage`)],
  ...overrides,
});

const promptsQuery = (args: string) => `{
  engagementPrompts(${args}) {
    ruleId
    ruleVersion
    goal
    stage { id title placement enforcement actions { type label url role } }
  }
}`;

const titles = (body: {
  data?: { engagementPrompts: Array<{ stage: { title: string } }> };
}) => body.data?.engagementPrompts.map(({ stage }) => stage.title);

describe('EngagementPromptsResolver', () => {
  let app: INestApplication;
  let session: unknown;
  let rules: EngagementRuleWithStages[];
  let prisma: {
    article: { findUnique: Mock };
    subscription: { findMany: Mock };
    paywallBypass: { count: Mock };
  };

  beforeAll(async () => {
    prisma = {
      article: { findUnique: vi.fn() },
      subscription: { findMany: vi.fn().mockResolvedValue([]) },
      paywallBypass: { count: vi.fn().mockResolvedValue(0) },
    };

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          context: ({ req }: { req: { user?: unknown } }) => {
            req.user = session;

            return { req };
          },
        }),
      ],
      providers: [
        EngagementPromptsResolver,
        EngagementStageResolver,
        NewsletterSignupResolver,
        ReaderContextService,
        {
          provide: NewsletterSignupService,
          useValue: {
            statusOf: (token?: string) =>
              token === 'signed-up' ? 'subscribed' : undefined,
            signUp: async (email: string) => `token-for-${email}`,
          },
        },
        {
          provide: NewsletterVerifier,
          useClass: UnavailableNewsletterVerifier,
        },
        {
          provide: ChallengeService,
          useValue: {
            validateChallenge: async ({ solution }: { solution: string }) => ({
              valid: solution === 'solved',
              message: 'Wrong challenge solution.',
            }),
          },
        },
        { provide: PrismaClient, useValue: prisma },
        {
          provide: EngagementRuleService,
          useValue: { getActiveRules: () => Promise.resolve(rules) },
        },
        { provide: ImageDataloaderService, useValue: { load: vi.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(() => app.close());

  beforeEach(() => {
    session = undefined;
    rules = [];
    prisma.article.findUnique.mockResolvedValue({
      contentGateDisabled: false,
      peerId: null,
      paywall: null,
    });
    prisma.paywallBypass.count.mockResolvedValue(0);
  });

  const send = (query: string) =>
    request(app.getHttpServer()).post('/').send({ query });

  it('shows the announcements of a page', async () => {
    rules = [
      rule('banner', {
        stages: [
          stage('banner-stage', {
            actions: [
              {
                id: 'action',
                stageId: 'banner-stage',
                createdAt: new Date(),
                modifiedAt: new Date(),
                type: EngagementActionType.URL,
                label: 'Go',
                url: 'https://example.com',
                style: '',
                role: EngagementActionRole.PRIMARY,
              },
            ],
          }),
        ],
      }),
      rule('elsewhere', { showOnPageIds: ['page-2'] }),
    ];

    const { body } = await send(
      promptsQuery('documentType: PAGE, documentId: "page-1"')
    );

    expect(body).toEqual({
      data: {
        engagementPrompts: [
          {
            ruleId: 'banner',
            ruleVersion: 3,
            goal: 'ANNOUNCEMENT',
            stage: {
              id: 'banner-stage',
              title: 'banner-stage',
              placement: 'BANNER',
              enforcement: 'SOFT',
              actions: [
                {
                  type: 'URL',
                  label: 'Go',
                  url: 'https://example.com',
                  role: 'PRIMARY',
                },
              ],
            },
          },
        ],
      },
    });
  });

  it('takes the audience from the session, not from the client', async () => {
    rules = [
      rule('anonymous', { audience: EngagementAudience.ANONYMOUS }),
      rule('registered', { audience: EngagementAudience.REGISTERED }),
    ];

    expect(
      titles(
        (await send(promptsQuery('documentType: PAGE, documentId: "page-1"')))
          .body
      )
    ).toEqual(['anonymous-stage']);

    session = {
      type: 'user',
      user: { id: 'user-1' },
      roles: [],
    };

    expect(
      titles(
        (await send(promptsQuery('documentType: PAGE, documentId: "page-1"')))
          .body
      )
    ).toEqual(['registered-stage']);

    const { body } = await send(
      promptsQuery('documentType: PAGE, documentId: "page-1", loggedIn: true')
    );

    expect(body.errors?.[0]?.message).toMatch(/Unknown argument "loggedIn"/);
  });

  it('shows rules for bypassed readers only with a valid bypass token', async () => {
    rules = [
      rule('bypassed', { audience: EngagementAudience.PAYWALL_BYPASSED }),
    ];

    expect(
      titles(
        (
          await send(
            promptsQuery(
              'documentType: PAGE, documentId: "page-1", paywallBypassToken: "forged"'
            )
          )
        ).body
      )
    ).toEqual([]);

    prisma.paywallBypass.count.mockResolvedValue(1);

    expect(
      titles(
        (
          await send(
            promptsQuery(
              'documentType: PAGE, documentId: "page-1", paywallBypassToken: "valid"'
            )
          )
        ).body
      )
    ).toEqual(['bypassed-stage']);
  });

  it('leads monthly subscribers to switching their own subscription to yearly', async () => {
    rules = [
      rule('yearly', {
        audience: EngagementAudience.MONTHLY_MEMBERS,
        stages: [
          stage('yearly-stage', {
            actions: [
              {
                id: 'switch',
                stageId: 'yearly-stage',
                createdAt: new Date('2026-01-01'),
                modifiedAt: new Date('2026-01-01'),
                type: EngagementActionType.SWITCH_TO_YEARLY,
                label: '',
                url: '',
                style: '',
                role: EngagementActionRole.PRIMARY,
              },
            ],
          }),
        ],
      }),
    ];
    session = { type: 'user', user: { id: 'user-1' }, roles: [] };
    prisma.subscription.findMany.mockResolvedValueOnce([
      {
        id: 'sub-1',
        memberPlanID: 'plan-1',
        startsAt: new Date('2026-01-01'),
        paidUntil: new Date(Date.now() + 86_400_000),
        paymentPeriodicity: 'monthly',
        extendable: true,
        deactivation: null,
        paymentMethod: { gracePeriod: 0 },
      },
    ]);

    const { body } = await send(
      promptsQuery('documentType: PAGE, documentId: "page-1"')
    );

    expect(body.data.engagementPrompts[0].stage.actions).toEqual([
      expect.objectContaining({
        type: EngagementActionType.SWITCH_TO_YEARLY,
        url: '/profile/subscription/sub-1?switchTo=yearly',
      }),
    ]);
  });

  it('stops asking readers for their email once they signed up', async () => {
    rules = [
      rule('newsletter', { goal: EngagementGoal.NEWSLETTER }),
      rule('announcement'),
    ];
    const page = 'documentType: PAGE, documentId: "page-1"';

    expect(titles((await send(promptsQuery(page))).body)?.sort()).toEqual([
      'announcement-stage',
      'newsletter-stage',
    ]);
    expect(
      titles(
        (await send(promptsQuery(`${page}, newsletterToken: "signed-up"`))).body
      )
    ).toEqual(['announcement-stage']);
    expect(
      titles(
        (await send(promptsQuery(`${page}, newsletterToken: "guess"`))).body
      )
    ).toHaveLength(2);
  });

  it('signs readers up for the newsletter with their email and the challenge', async () => {
    const { body } = await send(
      `mutation { signUpForNewsletter(email: "reader@example.com", challengeAnswer: { challengeID: "id", challengeSolution: "solved" }) { newsletterToken } }`
    );

    expect(body).toEqual({
      data: {
        signUpForNewsletter: {
          newsletterToken: 'token-for-reader@example.com',
        },
      },
    });
  });

  it('shows soft stages on articles, never a cutoff', async () => {
    rules = [
      rule('metered', {
        goal: EngagementGoal.MEMBERSHIP,
        meterWindowDays: 30,
        stages: [
          stage('soft', { placement: EngagementPlacement.MODAL }),
          stage('hard', {
            afterArticles: 1,
            placement: EngagementPlacement.CUTOFF,
            enforcement: EngagementEnforcement.HARD,
            requirement: EngagementRequirement.MEMBERSHIP,
            previewBlocks: 2,
          }),
        ],
      }),
    ];

    expect(
      titles(
        (
          await send(
            promptsQuery('documentType: ARTICLE, documentId: "article-1"')
          )
        ).body
      )
    ).toEqual(['soft']);
    expect(prisma.article.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'article-1' } })
    );
  });

  it('leaves out metered rules on excluded and paywalled articles', async () => {
    rules = [
      rule('metered', { goal: EngagementGoal.MEMBERSHIP, meterWindowDays: 30 }),
      rule('announcement'),
    ];

    for (const article of [
      { contentGateDisabled: true, peerId: null, paywall: null },
      { contentGateDisabled: false, peerId: null, paywall: { active: true } },
    ]) {
      prisma.article.findUnique.mockResolvedValue(article);

      expect(
        titles(
          (
            await send(
              promptsQuery('documentType: ARTICLE, documentId: "article-1"')
            )
          ).body
        )
      ).toEqual(['announcement-stage']);
    }
  });

  it('shows nothing for an unknown article', async () => {
    rules = [rule('announcement')];
    prisma.article.findUnique.mockResolvedValue(null);

    expect(
      titles(
        (await send(promptsQuery('documentType: ARTICLE, documentId: "x"')))
          .body
      )
    ).toEqual([]);
  });
});
