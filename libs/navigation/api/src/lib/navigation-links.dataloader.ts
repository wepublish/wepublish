import { DataLoaderService } from '@wepublish/utils/api';
import { NavigationLink, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  NAVIGATION_CACHE_NAMESPACE,
  NAVIGATION_CACHE_TTL_SECONDS,
} from './navigation-cache';

@Injectable({
  scope: Scope.REQUEST,
})
export class NavigationLinksDataloaderService extends DataLoaderService<
  NavigationLink[]
> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected async loadByKeys(navigationIds: string[]) {
    const links = groupBy(
      link => link.navigationId!,
      await this.kv.getOrLoadNs(
        NAVIGATION_CACHE_NAMESPACE,
        `links:${[...navigationIds].sort().join(',')}`,
        () =>
          this.prisma.navigationLink.findMany({
            where: {
              navigationId: {
                in: navigationIds,
              },
            },
          }),
        NAVIGATION_CACHE_TTL_SECONDS
      )
    );

    return navigationIds.map(id => links[id] ?? []);
  }
}
