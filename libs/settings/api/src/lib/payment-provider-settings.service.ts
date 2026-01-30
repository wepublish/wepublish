import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingPaymentProvider } from '@prisma/client';
import {
  CreateSettingPaymentProviderInput,
  UpdateSettingPaymentProviderInput,
  SettingPaymentProviderFilter,
} from './payment-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

@Injectable()
export class PaymentProviderSettingsService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async paymentProviderSettingsList(
    filter?: SettingPaymentProviderFilter
  ): Promise<SettingPaymentProvider[]> {
    const data = await this.prisma.settingPaymentProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async paymentProviderSetting(id: string): Promise<SettingPaymentProvider> {
    const data = await this.prisma.settingPaymentProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async createPaymentProviderSetting(
    input: CreateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const returnValue = this.prisma.settingPaymentProvider.create({
      data: input,
    });
    await this.kv.resetNamespace('settings:paymentprovider');
    return returnValue;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async updatePaymentProviderSetting(
    input: UpdateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const { id, ...updateData } = input;

    const existingSetting = await this.prisma.settingPaymentProvider.findUnique(
      {
        where: { id },
      }
    );

    if (!existingSetting) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = this.prisma.settingPaymentProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:paymentprovider');
    return returnValue;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async deletePaymentProviderSetting(
    id: string
  ): Promise<SettingPaymentProvider> {
    const existingSetting = await this.prisma.settingPaymentProvider.findUnique(
      {
        where: { id },
      }
    );

    if (!existingSetting) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    const returnValue = this.prisma.settingPaymentProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:paymentprovider');
    return returnValue;
  }
}
