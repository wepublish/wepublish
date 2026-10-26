import type { Mock } from 'vitest';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  NewsletterReferralMode,
} from '@prisma/client';
import { ImageDataloaderService } from '@wepublish/image/api';
import { PermissionsGuard } from '@wepublish/permissions/api';
import request from 'supertest';
import { EngagementRuleResolver } from './engagement-rule.resolver';
import { EngagementRuleService } from './engagement-rule.service';
import { EngagementStageResolver } from './engagement-stage.resolver';

const rule = {
  id: 'rule-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Announcement',
  goal: EngagementGoal.ANNOUNCEMENT,
  active: true,
  priority: 0,
  version: 1,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [
    {
      id: 'stage-1',
      afterArticles: 0,
      placement: EngagementPlacement.BANNER,
      enforcement: EngagementEnforcement.SOFT,
      requirement: null,
      previewBlocks: null,
      dismissible: true,
      hideForMinutes: 60,
      delaySeconds: 0,
      title: 'Hello',
      imageId: null,
      actions: [],
    },
  ],
};

const listQuery = `{ engagementRules { id name stages { id title image { id } } } }`;
const getQuery = `{ engagementRule(id: "rule-1") { id } }`;
const createMutation = `mutation {
  createEngagementRule(input: {
    name: "Announcement"
    goal: ANNOUNCEMENT
    stages: [{ afterArticles: 0, placement: BANNER, enforcement: SOFT, title: "Hello" }]
  }) { id }
}`;
const updateMutation = `mutation {
  updateEngagementRule(input: {
    id: "rule-1"
    name: "Announcement"
    goal: ANNOUNCEMENT
    stages: [{ afterArticles: 0, placement: BANNER, enforcement: SOFT }]
  }) { id }
}`;
const deleteMutation = `mutation { deleteEngagementRule(id: "rule-1") { id } }`;

const sessionWith = (...permissionIDs: string[]) => ({
  type: 'user',
  user: { id: 'user-1' },
  roles: [{ id: 'role', permissionIDs }],
});

describe('EngagementRuleResolver', () => {
  let app: INestApplication;
  let session: ReturnType<typeof sessionWith> | undefined;
  let service: Record<
    'getRules' | 'getRule' | 'create' | 'update' | 'delete',
    Mock
  >;

  beforeAll(async () => {
    service = {
      getRules: vi.fn().mockResolvedValue([rule]),
      getRule: vi.fn().mockResolvedValue(rule),
      create: vi.fn().mockResolvedValue(rule),
      update: vi.fn().mockResolvedValue(rule),
      delete: vi.fn().mockResolvedValue(rule),
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
        EngagementRuleResolver,
        EngagementStageResolver,
        { provide: EngagementRuleService, useValue: service },
        { provide: ImageDataloaderService, useValue: { load: vi.fn() } },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    vi.clearAllMocks();
    session = undefined;
  });

  const send = (query: string) =>
    request(app.getHttpServer()).post('/').send({ query });

  it.each([
    ['engagementRules', listQuery, undefined],
    ['engagementRules', listQuery, sessionWith('CAN_GET_BANNERS')],
    ['engagementRule', getQuery, sessionWith('CAN_GET_ENGAGEMENT_RULES')],
    [
      'createEngagementRule',
      createMutation,
      sessionWith('CAN_GET_ENGAGEMENT_RULE'),
    ],
    [
      'updateEngagementRule',
      updateMutation,
      sessionWith('CAN_CREATE_ENGAGEMENT_RULE'),
    ],
    [
      'deleteEngagementRule',
      deleteMutation,
      sessionWith('CAN_UPDATE_ENGAGEMENT_RULE'),
    ],
  ])('refuses %s without its permission', async (_, query, as) => {
    session = as;

    const { body } = await send(query);

    expect(body.errors?.[0]?.message).toMatch(/Forbidden/);
    expect(service.getRules).not.toHaveBeenCalled();
    expect(service.getRule).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it('lists the rules', async () => {
    session = sessionWith('CAN_GET_ENGAGEMENT_RULES');

    const { body } = await send(listQuery);

    expect(body).toEqual({
      data: {
        engagementRules: [
          {
            id: 'rule-1',
            name: 'Announcement',
            stages: [{ id: 'stage-1', title: 'Hello', image: null }],
          },
        ],
      },
    });
  });

  it('gets a rule, and says when it does not exist', async () => {
    session = sessionWith('CAN_GET_ENGAGEMENT_RULE');

    expect((await send(getQuery)).body.data).toEqual({
      engagementRule: { id: 'rule-1' },
    });

    service.getRule.mockResolvedValueOnce(null);

    expect((await send(getQuery)).body.errors?.[0]?.message).toMatch(
      /not found/
    );
  });

  it('creates, updates and deletes with their permissions', async () => {
    session = sessionWith(
      'CAN_CREATE_ENGAGEMENT_RULE',
      'CAN_UPDATE_ENGAGEMENT_RULE',
      'CAN_DELETE_ENGAGEMENT_RULE'
    );

    expect((await send(createMutation)).body.errors).toBeUndefined();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Announcement',
        active: true,
        audience: EngagementAudience.ALL,
        showOnPageIds: [],
        stages: [
          expect.objectContaining({
            dismissible: true,
            hideForMinutes: 1440,
            actions: [],
          }),
        ],
      })
    );

    expect((await send(updateMutation)).body.errors).toBeUndefined();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rule-1' })
    );

    expect((await send(deleteMutation)).body.errors).toBeUndefined();
    expect(service.delete).toHaveBeenCalledWith('rule-1');
  });
});
