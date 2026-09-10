import { Injectable, Scope } from '@nestjs/common';
import { SettingKnowledgeProvider, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class KnowledgeProviderSettingsDataloaderService
  implements Primeable<SettingKnowledgeProvider>
{
  private dataloader = new DataLoader<string, SettingKnowledgeProvider | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingKnowledgeProvider.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'KnowledgeProviderSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingKnowledgeProvider | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingKnowledgeProvider | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingKnowledgeProvider | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
