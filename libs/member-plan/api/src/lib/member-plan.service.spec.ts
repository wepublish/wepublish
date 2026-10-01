import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { MemberPlanService } from './member-plan.service';
import { MemberPlanDataloader } from './member-plan.dataloader';

vi.mock('./member-plan.model', () => ({
  MemberPlanSort: { CreatedAt: 'CreatedAt', ModifiedAt: 'ModifiedAt' },
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

    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();

    service = new MemberPlanService(
      prisma as unknown as PrismaClient,
      module.get(KvTtlCacheService)
    );
    Object.assign(service, {
      [`__DATALOADER__${MemberPlanDataloader.name}`]: { prime: vi.fn() },
    });
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
});
