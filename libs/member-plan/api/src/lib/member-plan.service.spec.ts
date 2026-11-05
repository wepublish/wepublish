import type { Mock } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import {
  NamespacedCache,
  NamespaceResets,
  NamespaceVersions,
} from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import {
  PUBLIC_CONTENT_NAMESPACE,
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  PublicContentCacheInvalidator,
  PublicContentInvalidatorModule,
} from '@wepublish/public-content-cache/api';
import { MEMBER_PLAN_SHARED_NAMESPACES } from './member-plan-cache';
import { MemberPlanService } from './member-plan.service';
import { MemberPlanDataloader } from './member-plan.dataloader';

vi.mock('./member-plan.model', () => ({
  MemberPlanSort: { CreatedAt: 'CreatedAt', ModifiedAt: 'ModifiedAt' },
  MemberPlanListArgs: class {},
  CreateMemberPlanInput: class {},
  UpdateMemberPlanInput: class {},
  // emitDecoratorMetadata turns every decorated parameter type into a runtime
  // reference, so the classes member-plan.service.ts imports have to exist on
  // the mock even though the tests never touch them.
  MemberPlanFilter: class {},
  MemberPlanListArgs: class {},
  CreateMemberPlanInput: class {},
  UpdateMemberPlanInput: class {},
  PeriodicityPriceInput: class {},
}));

describe('MemberPlanService cache', () => {
  const memberPlan = {
    id: 'plan-1',
    slug: 'abo',
    active: true,
    extendable: true,
    defaultPaymentPeriodicity: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    availablePaymentMethods: [
      {
        paymentMethodIDs: ['pm-1'],
        paymentPeriodicities: [PaymentPeriodicity.yearly],
        forceAutoRenewal: false,
      },
    ],
    periodicityPricing: [],
  };
  let service: MemberPlanService;
  let module: TestingModule;
  let kv: NamespacedCache;
  let versions: NamespaceVersions;
  let prisma: {
    memberPlan: {
      findMany: Mock;
      findFirst: Mock;
      count: Mock;
      findUniqueOrThrow: Mock;
      update: Mock;
      delete: Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      memberPlan: {
        findMany: vi.fn().mockResolvedValue([memberPlan]),
        findFirst: vi.fn().mockResolvedValue(memberPlan),
        count: vi.fn().mockResolvedValue(1),
        findUniqueOrThrow: vi.fn().mockResolvedValue(memberPlan),
        update: vi.fn().mockResolvedValue(memberPlan),
        delete: vi.fn().mockResolvedValue(memberPlan),
      },
    };

    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: [
            ...PUBLIC_CONTENT_SHARED_NAMESPACES,
            ...MEMBER_PLAN_SHARED_NAMESPACES,
          ],
        }),
        PublicContentInvalidatorModule,
      ],
    }).compile();
    await module.init();

    kv = module.get(NamespacedCache);
    versions = module.get(NamespaceVersions);
    service = new MemberPlanService(
      prisma as unknown as PrismaClient,
      kv,
      module.get(NamespaceResets),
      module.get(PublicContentCacheInvalidator)
    );
    Object.assign(service, {
      [`__DATALOADER__${MemberPlanDataloader.name}`]: { prime: vi.fn() },
    });
  });

  afterEach(() => module.close());

  it('shares the member plans through Dragonfly', () => {
    expect(MEMBER_PLAN_SHARED_NAMESPACES).toEqual(['member-plans']);
  });

  it('serves the active member plans from the cache', async () => {
    await service.getActiveMemberPlans();
    const second = await service.getActiveMemberPlans();

    expect(prisma.memberPlan.findMany).toHaveBeenCalledTimes(1);
    expect(second).toEqual([memberPlan]);
  });

  it('caches member plan lists per filter', async () => {
    await service.getMemberPlans({ filter: { active: true }, take: 50 });
    await service.getMemberPlans({ filter: { active: true }, take: 50 });
    await service.getMemberPlans({ filter: { active: false }, take: 50 });

    expect(prisma.memberPlan.findMany).toHaveBeenCalledTimes(2);
  });

  it('serves a member plan by slug from the cache', async () => {
    await service.getMemberPlanBySlug('abo');
    await service.getMemberPlanBySlug('abo');

    expect(prisma.memberPlan.findFirst).toHaveBeenCalledTimes(1);
  });

  it('loads member plans again after one was updated', async () => {
    await service.getActiveMemberPlans();
    await service.updateMemberPlan({ id: 'plan-1', name: 'Abo' });
    await service.getActiveMemberPlans();

    expect(prisma.memberPlan.findMany).toHaveBeenCalledTimes(2);
  });

  it('loads member plans again after one was deleted', async () => {
    await service.getActiveMemberPlans();
    await service.deleteMemberPlan('plan-1');
    await service.getActiveMemberPlans();

    expect(prisma.memberPlan.findMany).toHaveBeenCalledTimes(2);
  });

  it.each<[string, () => Promise<unknown>]>([
    ['updated', () => service.updateMemberPlan({ id: 'plan-1', name: 'Abo' })],
    ['deleted', () => service.deleteMemberPlan('plan-1')],
  ])(
    'loads the member plans of paywalls again after one was %s',
    async (_, change) => {
      const loader = vi.fn().mockResolvedValue([memberPlan]);

      await kv.getOrLoadNs('content:paywalls', 'member-plans:pw-1', loader, 60);
      await change();
      await kv.getOrLoadNs('content:paywalls', 'member-plans:pw-1', loader, 60);

      expect(loader).toHaveBeenCalledTimes(2);
    }
  );

  it('retires anonymous answers after a member plan changed', async () => {
    const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);

    await service.updateMemberPlan({ id: 'plan-1', name: 'Abo' });

    await expect(versions.current(PUBLIC_CONTENT_NAMESPACE)).resolves.not.toBe(
      before
    );
  });
});
