import { Injectable, Scope } from '@nestjs/common';
import { SettingPdfRenderer, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class PdfRendererSettingsDataloaderService
  implements Primeable<SettingPdfRenderer>
{
  private dataloader = new DataLoader<string, SettingPdfRenderer | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingPdfRenderer.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'PdfRendererSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingPdfRenderer | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingPdfRenderer | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingPdfRenderer | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
