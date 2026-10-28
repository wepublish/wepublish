import type { Mock } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
  PrismaClient,
} from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { EngagementRuleService } from './engagement-rule.service';
import { CreateEngagementRuleInput } from './engagement-rule.model';

const stage = {
  id: 'stage-1',
  ruleId: 'rule-1',
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
  title: 'Hello',
  text: 'World',
  cta: null,
  description: null,
  html: null,
  embedUrl: null,
  imageId: null,
  actions: [],
};

const storedRule = {
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
  includePeeredArticles: false,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [{ key: 'utm_medium', value: 'email' }],
  showOnPages: [{ id: 'page-1' }],
  audienceMemberPlans: [{ id: 'plan-1' }],
  stages: [stage],
};

const metered: CreateEngagementRuleInput = {
  name: 'Grow newsletter',
  goal: EngagementGoal.NEWSLETTER,
  active: true,
  priority: 1,
  audience: EngagementAudience.ANONYMOUS,
  showOnArticles: true,
  showOnPageIds: ['page-1'],
  includePeeredArticles: false,
  meterWindowDays: 30,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [
    {
      afterArticles: 2,
      placement: EngagementPlacement.MODAL,
      enforcement: EngagementEnforcement.SOFT,
      dismissible: true,
      hideForMinutes: 1440,
      delaySeconds: 0,
      title: 'Like it?',
      actions: [
        {
          type: EngagementActionType.NEWSLETTER,
          label: 'Subscribe',
          url: 'https://example.com/newsletter',
          style: '',
          role: EngagementActionRole.PRIMARY,
        },
      ],
    },
    {
      afterArticles: 4,
      placement: EngagementPlacement.CUTOFF,
      enforcement: EngagementEnforcement.HARD,
      requirement: EngagementRequirement.REGISTRATION,
      previewBlocks: 3,
      dismissible: true,
      hideForMinutes: 1440,
      delaySeconds: 0,
      actions: [
        {
          type: EngagementActionType.NEWSLETTER,
          label: '',
          url: 'https://example.com/newsletter',
          style: '',
          role: EngagementActionRole.PRIMARY,
        },
        {
          type: EngagementActionType.LOGIN,
          label: '',
          url: '',
          style: '',
          role: EngagementActionRole.OTHER,
        },
      ],
    },
  ],
};

describe('EngagementRuleService', () => {
  let service: EngagementRuleService;
  let kv: KvTtlCacheService;
  let invalidator: PublicContentCacheInvalidator;
  let prisma: {
    engagementRule: Record<
      'findMany' | 'findUnique' | 'create' | 'update' | 'delete',
      Mock
    >;
    engagementStage: { deleteMany: Mock };
    $transaction: Mock;
  };

  beforeEach(async () => {
    prisma = {
      engagementRule: {
        findMany: vi.fn().mockResolvedValue([storedRule]),
        findUnique: vi.fn().mockResolvedValue(storedRule),
        create: vi.fn().mockResolvedValue(storedRule),
        update: vi.fn().mockResolvedValue(storedRule),
        delete: vi.fn().mockResolvedValue(storedRule),
      },
      engagementStage: { deleteMany: vi.fn() },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation(async (run: unknown) =>
      typeof run === 'function' ? run(prisma) : Promise.all(run as unknown[])
    );

    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();

    kv = module.get(KvTtlCacheService);
    invalidator = new PublicContentCacheInvalidator(kv);
    vi.spyOn(invalidator, 'invalidate');
    service = new EngagementRuleService(
      prisma as unknown as PrismaClient,
      kv,
      invalidator
    );
  });

  it('maps stored rules onto the GraphQL shape', async () => {
    expect(await service.getRules()).toEqual([
      expect.objectContaining({
        id: 'rule-1',
        showOnPageIds: ['page-1'],
        audienceMemberPlanIds: ['plan-1'],
        newsletterParams: [{ key: 'utm_medium', value: 'email' }],
        stages: [expect.objectContaining({ id: 'stage-1', actions: [] })],
      }),
    ]);
  });

  it('serves the active rules from the cache', async () => {
    await service.getActiveRules();
    const second = await service.getActiveRules();

    expect(prisma.engagementRule.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.engagementRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    );
    expect(second).toEqual([
      expect.objectContaining({ id: 'rule-1', showOnPageIds: ['page-1'] }),
    ]);
  });

  it('creates a rule with its stages, actions and pages', async () => {
    await service.create(metered);

    const { data } = prisma.engagementRule.create.mock.calls[0][0];

    expect(data).toMatchObject({
      name: 'Grow newsletter',
      showOnPages: { connect: [{ id: 'page-1' }] },
      stages: {
        create: [
          expect.objectContaining({
            afterArticles: 2,
            actions: {
              create: [expect.objectContaining({ label: 'Subscribe' })],
            },
          }),
          expect.objectContaining({ afterArticles: 4, dismissible: false }),
        ],
      },
    });
    expect(data).not.toHaveProperty('showOnPageIds');
  });

  it('connects the plans of a member plans audience', async () => {
    await service.create({
      ...metered,
      audience: EngagementAudience.MEMBER_PLANS,
      audienceMemberPlanIds: ['plan-1'],
    });

    const { data } = prisma.engagementRule.create.mock.calls[0][0];

    expect(data).toMatchObject({
      audienceMemberPlans: { connect: [{ id: 'plan-1' }] },
    });
    expect(data).not.toHaveProperty('audienceMemberPlanIds');
  });

  it('refuses an inconsistent rule, saying what is wrong', async () => {
    const invalid = {
      ...metered,
      stages: [...metered.stages].reverse(),
    };

    await expect(service.create(invalid)).rejects.toThrow(BadRequestException);
    await expect(service.create(invalid)).rejects.toMatchObject({
      response: {
        problems: expect.arrayContaining([
          { path: 'stages.0.enforcement', code: 'hardNotLast' },
        ]),
      },
    });
    expect(prisma.engagementRule.create).not.toHaveBeenCalled();
  });

  it('replaces the stages and bumps the version on update', async () => {
    await service.update({ ...metered, id: 'rule-1' });

    expect(prisma.engagementStage.deleteMany).toHaveBeenCalledWith({
      where: { ruleId: 'rule-1' },
    });
    expect(prisma.engagementRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rule-1' },
        data: expect.objectContaining({
          version: { increment: 1 },
          showOnPages: { set: [{ id: 'page-1' }] },
          audienceMemberPlans: { set: [] },
        }),
      })
    );
  });

  it('refuses an inconsistent update', async () => {
    await expect(
      service.update({ ...metered, id: 'rule-1', meterWindowDays: 0 })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.engagementRule.update).not.toHaveBeenCalled();
  });

  it.each([
    ['created', (s: EngagementRuleService) => s.create(metered)],
    [
      'updated',
      (s: EngagementRuleService) => s.update({ ...metered, id: 'rule-1' }),
    ],
    ['deleted', (s: EngagementRuleService) => s.delete('rule-1')],
  ])(
    'forgets the active rules and article answers once a rule was %s',
    async (_, change) => {
      await service.getActiveRules();
      await change(service);
      await service.getActiveRules();

      expect(prisma.engagementRule.findMany).toHaveBeenCalledTimes(2);
      expect(invalidator.invalidate).toHaveBeenCalledWith(
        'engagement',
        'articles'
      );
    }
  );
});
