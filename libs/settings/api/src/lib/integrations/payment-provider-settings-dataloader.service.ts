import { Injectable, Scope } from '@nestjs/common';
import { SettingPaymentProvider, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class PaymentProviderSettingsDataloaderService
  implements Primeable<SettingPaymentProvider>
{
  private dataloader = new DataLoader<string, SettingPaymentProvider | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.settingPaymentProvider.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'PaymentProviderSettingsDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, SettingPaymentProvider | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, SettingPaymentProvider | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, SettingPaymentProvider | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
