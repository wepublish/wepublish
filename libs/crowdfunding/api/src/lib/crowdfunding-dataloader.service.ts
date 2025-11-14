import { Injectable, Scope } from '@nestjs/common';
import { Crowdfunding, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class CrowdfundingDataloaderService implements Primeable<Crowdfunding> {
  private dataloader = new DataLoader<string, Crowdfunding | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.crowdfunding.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'CrowdfundingDataloaderService' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Crowdfunding | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Crowdfunding | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, Crowdfunding | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
