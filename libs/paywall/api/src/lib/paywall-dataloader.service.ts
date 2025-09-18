import { Injectable, Scope } from '@nestjs/common';
import { Paywall, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class PaywallDataloaderService implements Primeable<Paywall> {
  private dataloader = new DataLoader<string, Paywall | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.paywall.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'PaywallDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Paywall | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Paywall | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Paywall | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
