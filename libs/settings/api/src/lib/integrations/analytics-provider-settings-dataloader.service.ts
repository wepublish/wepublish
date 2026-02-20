import { Injectable, Scope } from '@nestjs/common';
import { SettingAnalyticsProvider, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class AnalyticsProviderSettingsDataloaderService
  implements Primeable<SettingAnalyticsProvider>
{
  private dataloader = new DataLoader<string, SettingAnalyticsProvider | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingAnalyticsProvider.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'AnalyticsProviderSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingAnalyticsProvider | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingAnalyticsProvider | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingAnalyticsProvider | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
