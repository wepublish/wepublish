import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { PaywallDataloaderService } from './paywall-dataloader.service';
import { PaywallMemberPlansDataloader } from './paywall-member-plans.dataloader';
import { PaywallService } from './paywall.service';

describe('paywall cache', () => {
  let kv: KvTtlCacheService;
  const prisma = {
    paywall: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    paywallMemberplan: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma.paywall.findMany
      .mockReset()
      .mockResolvedValue([{ id: 'paywall-1', name: 'Paywall' }]);
    prisma.paywallMemberplan.findMany
      .mockReset()
      .mockResolvedValue([
        { paywallId: 'paywall-1', memberPlan: { id: 'plan-1' } },
      ]);
    for (const write of ['create', 'update', 'delete'] as const) {
      prisma.paywall[write].mockReset().mockResolvedValue({ id: 'paywall-1' });
    }
  });

  it.each<[string, () => { load: (id: string) => Promise<unknown> }, Mock]>([
    [
      'a paywall',
      () => new PaywallDataloaderService(prisma as any, kv),
      prisma.paywall.findMany,
    ],
    [
      'the member plans of a paywall',
      () => new PaywallMemberPlansDataloader(prisma as any, kv),
      prisma.paywallMemberplan.findMany,
    ],
  ])('loads %s once across requests', async (_, loader, query) => {
    const first = await loader().load('paywall-1');
    const second = await loader().load('paywall-1');

    expect(second).toEqual(first);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('loads them again once paywalls changed', async () => {
    await new PaywallDataloaderService(prisma as any, kv).load('paywall-1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('paywalls');
    await new PaywallDataloaderService(prisma as any, kv).load('paywall-1');

    expect(prisma.paywall.findMany).toHaveBeenCalledTimes(2);
  });

  describe('writes', () => {
    const publicContentCache = { invalidate: vi.fn() };
    const service = () =>
      Object.assign(
        new PaywallService(prisma as any, publicContentCache as any),
        {
          __DATALOADER__PaywallDataloaderService: { prime: vi.fn() },
        }
      );

    beforeEach(() => {
      publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
    });

    it.each<[string, () => Promise<unknown>]>([
      [
        'creating',
        () =>
          service().createPaywall({
            hideContentAfter: 0,
            memberPlanIds: [],
            bypassTokens: [],
          } as any),
      ],
      ['updating', () => service().updatePaywall({ id: 'paywall-1' } as any)],
      ['deleting', () => service().deletePaywall('paywall-1')],
    ])(
      'clears cached paywalls and answers after %s a paywall',
      async (_, change) => {
        await change();

        expect(publicContentCache.invalidate.mock.calls[0]).toContain(
          'paywalls'
        );
      }
    );

    it('also clears cached articles after deleting a paywall, since they would keep its id', async () => {
      await service().deletePaywall('paywall-1');

      expect(publicContentCache.invalidate).toHaveBeenCalledWith(
        'paywalls',
        'articles'
      );
    });
  });
});
