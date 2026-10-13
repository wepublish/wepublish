import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { GateMemberPlansDataloader } from './gate-member-plans.dataloader';
import type { Mock } from 'vitest';

describe('GateMemberPlansDataloader', () => {
  let dataloader: GateMemberPlansDataloader;
  let prismaMock: {
    gateMemberPlan: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      gateMemberPlan: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        GateMemberPlansDataloader,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    dataloader = await module.resolve(GateMemberPlansDataloader);
  });

  it('should batch loads into a single query', async () => {
    prismaMock.gateMemberPlan.findMany.mockResolvedValue([]);

    await Promise.all([
      dataloader.load('gate-1'),
      dataloader.load('gate-2'),
      dataloader.load('gate-1'),
    ]);

    expect(prismaMock.gateMemberPlan.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.gateMemberPlan.findMany).toHaveBeenCalledWith({
      where: {
        gateId: {
          in: ['gate-1', 'gate-2'],
        },
      },
      include: {
        memberPlan: {
          include: {
            availablePaymentMethods: true,
            periodicityPricing: true,
          },
        },
      },
    });
  });

  it('should group member plans by gate', async () => {
    const memberPlan1 = {
      id: 'plan-1',
      availablePaymentMethods: [],
      periodicityPricing: [],
    };
    const memberPlan2 = {
      id: 'plan-2',
      availablePaymentMethods: [],
      periodicityPricing: [],
    };

    prismaMock.gateMemberPlan.findMany.mockResolvedValue([
      { gateId: 'gate-1', memberPlan: memberPlan1 },
      { gateId: 'gate-1', memberPlan: memberPlan2 },
      { gateId: 'gate-2', memberPlan: memberPlan2 },
    ]);

    const result = await dataloader.loadMany(['gate-1', 'gate-2', 'gate-3']);

    expect(result).toEqual([[memberPlan1, memberPlan2], [memberPlan2], []]);
  });
});
