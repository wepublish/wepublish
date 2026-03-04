import { Injectable, Scope } from '@nestjs/common';
import { SettingTrackingPixel, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class TrackingPixelSettingsProviderDataloaderService
  implements Primeable<SettingTrackingPixel>
{
  private dataloader = new DataLoader<string, SettingTrackingPixel | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingTrackingPixel.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'TrackingPixelSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingTrackingPixel | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingTrackingPixel | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingTrackingPixel | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
