import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { NavigationLinksDataloaderService } from './navigation-links.dataloader';
import { NAVIGATION_CACHE_NAMESPACE } from './navigation-cache';

describe('NavigationLinksDataloaderService', () => {
  const link = { id: 'link-1', navigationId: 'nav-1', label: 'Home' };
  let prisma: { navigationLink: { findMany: jest.Mock } };
  let kv: KvTtlCacheService;

  beforeEach(async () => {
    prisma = {
      navigationLink: { findMany: jest.fn().mockResolvedValue([link]) },
    };
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
  });

  const newRequest = () =>
    new NavigationLinksDataloaderService(prisma as unknown as PrismaClient, kv);

  it('shares loaded links between requests', async () => {
    await newRequest().load('nav-1');
    const second = await newRequest().load('nav-1');

    expect(prisma.navigationLink.findMany).toHaveBeenCalledTimes(1);
    expect(second).toEqual([link]);
  });

  it('loads the links again after the navigations changed', async () => {
    await newRequest().load('nav-1');
    await kv.resetNamespace(NAVIGATION_CACHE_NAMESPACE);
    await newRequest().load('nav-1');

    expect(prisma.navigationLink.findMany).toHaveBeenCalledTimes(2);
  });
});
