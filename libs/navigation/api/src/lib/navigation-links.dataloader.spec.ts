import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { NavigationLinksDataloaderService } from './navigation-links.dataloader';
import { NAVIGATION_SHARED_NAMESPACES } from '../index';
import { NAVIGATION_CACHE_NAMESPACE } from './navigation-cache';

describe('NavigationLinksDataloaderService', () => {
  const link = { id: 'link-1', navigationId: 'nav-1', label: 'Home' };
  let prisma: { navigationLink: { findMany: Mock } };
  let kv: NamespacedCacheTesting;

  beforeEach(async () => {
    prisma = {
      navigationLink: { findMany: vi.fn().mockResolvedValue([link]) },
    };
    kv = await createNamespacedCacheTesting({
      sharedNamespaces: NAVIGATION_SHARED_NAMESPACES,
    });
  });

  afterEach(() => kv.close());

  const newRequest = () =>
    new NavigationLinksDataloaderService(
      prisma as unknown as PrismaClient,
      kv.cache
    );

  it('shares the navigations through Dragonfly', () => {
    expect(NAVIGATION_SHARED_NAMESPACES).toEqual([NAVIGATION_CACHE_NAMESPACE]);
  });

  it('shares loaded links between requests', async () => {
    await newRequest().load('nav-1');
    const second = await newRequest().load('nav-1');

    expect(prisma.navigationLink.findMany).toHaveBeenCalledTimes(1);
    expect(second).toEqual([link]);
  });

  it('loads the links again after the navigations changed', async () => {
    await newRequest().load('nav-1');
    await kv.resets.reset(NAVIGATION_CACHE_NAMESPACE);
    await newRequest().load('nav-1');

    expect(prisma.navigationLink.findMany).toHaveBeenCalledTimes(2);
  });
});
