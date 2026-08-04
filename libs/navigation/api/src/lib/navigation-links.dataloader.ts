import { DataLoaderService } from '@wepublish/utils/api';
import { NavigationLink, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class NavigationLinksDataloaderService extends DataLoaderService<
  NavigationLink[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(navigationIds: string[]) {
    const links = groupBy(
      link => link.navigationId!,
      await this.prisma.navigationLink.findMany({
        where: {
          navigationId: {
            in: navigationIds,
          },
        },
      })
    );

    return navigationIds.map(id => links[id] ?? []);
  }
}
