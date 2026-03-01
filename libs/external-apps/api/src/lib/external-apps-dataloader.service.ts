import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

type ExternalApps = {
  id: string;
  createdAt: Date;
  modifiedAt: Date;
  name: string;
  url: string;
  target: string;
  icon: string | null;
};

@Injectable({
  scope: Scope.REQUEST,
})
export class ExternalAppsDataloaderService implements Primeable<ExternalApps> {
  private dataloader = new DataLoader<string, ExternalApps | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.externalApps.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'ExternalAppsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, ExternalApps | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, ExternalApps | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, ExternalApps | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
