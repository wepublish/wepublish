import { Injectable, Scope } from '@nestjs/common';
import { SettingLetterProvider, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class LetterProviderSettingsDataloaderService
  implements Primeable<SettingLetterProvider>
{
  private dataloader = new DataLoader<string, SettingLetterProvider | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingLetterProvider.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'LetterProviderSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingLetterProvider | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingLetterProvider | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingLetterProvider | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
