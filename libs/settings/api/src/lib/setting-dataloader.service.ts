import { Injectable, Scope } from '@nestjs/common';
import { Setting, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class SettingDataloaderService implements Primeable<Setting> {
  private dataloader = new DataLoader<string, Setting | null>(
    async (names: readonly string[]) =>
      createOptionalsArray(
        names as string[],
        await this.prisma.setting.findMany({
          where: {
            name: {
              in: names as string[],
            },
          },
        }),
        'name'
      ),
    { name: 'SettingDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Setting | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Setting | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Setting | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
