import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingAnalyticsProvider } from '@prisma/client';
import {
  CreateSettingAnalyticsProviderInput,
  UpdateSettingAnalyticsProviderInput,
  SettingAnalyticsProviderFilter,
  SettingAnalyticsCredentialsInput,
} from './analytics-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { AnalyticsProviderSettingsDataloaderService } from './analytics-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

@Injectable()
export class AnalyticsProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends {
      credentials?: SettingAnalyticsCredentialsInput | null;
      apiKey?: string | null;
    },
  >(
    data: T
  ): Omit<T, 'credentials' | 'apiKey'> & { credentials?: string | null } {
    const { credentials, apiKey, ...rest } = data;

    // Plausible and Umami store their api key where Google stores its credentials
    if (apiKey) {
      return { ...rest, credentials: this.crypto.encrypt(apiKey) };
    }

    if (credentials === undefined) {
      return rest;
    }

    if (credentials === null) {
      return { ...rest, credentials: null };
    }

    return {
      ...rest,
      credentials: this.crypto.encrypt(JSON.stringify(credentials)),
    };
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async analyticsProviderSettingsList(
    filter?: SettingAnalyticsProviderFilter
  ): Promise<SettingAnalyticsProvider[]> {
    return this.prisma.settingAnalyticsProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async analyticsProviderSetting(
    id: string
  ): Promise<SettingAnalyticsProvider> {
    const data = await this.prisma.settingAnalyticsProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Analytics Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async createAnalyticsProviderSetting(
    input: CreateSettingAnalyticsProviderInput
  ): Promise<SettingAnalyticsProvider> {
    const output = this.encryptSecretsIfPresent(input);

    const returnValue = await this.prisma.settingAnalyticsProvider.upsert({
      where: { id: output.id },
      create: output,
      update: {},
    });

    await this.kv.resetNamespace('settings:analyticsprovider');

    return returnValue;
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async updateAnalyticsProviderSetting(
    input: UpdateSettingAnalyticsProviderInput
  ): Promise<SettingAnalyticsProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;

    const existingSetting =
      await this.prisma.settingAnalyticsProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Analytics Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.$transaction(async transaction => {
      // Only one provider can power Hot & Trending
      if (updateData.hotAndTrending) {
        await transaction.settingAnalyticsProvider.updateMany({
          where: { id: { not: id }, hotAndTrending: true },
          data: { hotAndTrending: false },
        });
      }

      return transaction.settingAnalyticsProvider.update({
        where: { id },
        data: filteredUpdateData,
      });
    });

    await this.kv.resetNamespace('settings:analyticsprovider');
    return returnValue;
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async deleteAnalyticsProviderSetting(
    id: string
  ): Promise<SettingAnalyticsProvider> {
    const existingSetting =
      await this.prisma.settingAnalyticsProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Analytics Provider Setting with id ${id} not found`
      );
    }

    const returnValue = await this.prisma.settingAnalyticsProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:analyticsprovider');
    return returnValue;
  }
}
