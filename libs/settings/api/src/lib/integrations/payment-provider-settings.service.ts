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
import { SecretCrypto } from './secrets-cryto';

@Injectable()
export class PaymentProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends { apiKey?: string | null; webhookEndpointSecret?: string | null },
  >(data: T): T {
    if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
      return {
        ...data,
        apiKey: this.crypto.encrypt(data.apiKey),
      };
    }

    if (
      typeof data.webhookEndpointSecret === 'string' &&
      data.webhookEndpointSecret.length > 0
    ) {
      return {
        ...data,
        webhookEndpointSecret: this.crypto.encrypt(data.webhookEndpointSecret),
      };
    }

    return data;
  }

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
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = this.prisma.settingPaymentProvider.create({
      data: output,
    });

    await this.kv.resetNamespace('settings:paymentprovider');

    return returnValue;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async updatePaymentProviderSetting(
    input: UpdateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;

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
