import { Injectable, Scope } from '@nestjs/common';
import { Page, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class PageDataloaderService implements Primeable<Page> {
  private dataloader = new DataLoader<string, Page | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.page.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'PageDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Page | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Page | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Page | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
