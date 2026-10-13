import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { GateDataloaderService } from './gate-dataloader.service';
import { GateMemberPlansDataloader } from './gate-member-plans.dataloader';

describe('gate cache', () => {
  let kv: KvTtlCacheService;
  const prisma = {
    gate: { findMany: vi.fn() },
    gateMemberPlan: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma.gate.findMany
      .mockReset()
      .mockResolvedValue([{ id: 'gate-1', name: 'Paywall', actions: [] }]);
    prisma.gateMemberPlan.findMany
      .mockReset()
      .mockResolvedValue([{ gateId: 'gate-1', memberPlan: { id: 'plan-1' } }]);
  });

  it.each<[string, () => { load: (id: string) => Promise<unknown> }, Mock]>([
    [
      'a gate',
      () => new GateDataloaderService(prisma as any, kv),
      prisma.gate.findMany,
    ],
    [
      'the member plans of a gate',
      () => new GateMemberPlansDataloader(prisma as any, kv),
      prisma.gateMemberPlan.findMany,
    ],
  ])('loads %s once across requests', async (_, loader, query) => {
    const first = await loader().load('gate-1');
    const second = await loader().load('gate-1');

    expect(second).toEqual(first);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('loads them again once gates changed', async () => {
    await new GateDataloaderService(prisma as any, kv).load('gate-1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('gates');
    await new GateDataloaderService(prisma as any, kv).load('gate-1');

    expect(prisma.gate.findMany).toHaveBeenCalledTimes(2);
  });
});
