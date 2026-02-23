import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingAnalyticsProvider } from '@prisma/client';
import {
  CreateSettingAnalyticsProviderInput,
  UpdateSettingAnalyticsProviderInput,
  SettingAnalyticsProviderFilter,
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

  private encryptSecretsIfPresent<T extends { credentials?: string | null }>(
    data: T
  ): T {
    if (typeof data.credentials === 'string' && data.credentials.length > 0) {
      // Validate that credentials is valid JSON
      try {
        JSON.parse(data.credentials);
      } catch (e) {
        throw new Error(
          'Invalid credentials format: must be a valid JSON string'
        );
      }
      return {
        ...data,
        credentials: this.crypto.encrypt(data.credentials),
      };
    }
    return data;
  }

  @PrimeDataLoader(AnalyticsProviderSettingsDataloaderService, 'id')
  async analyticsProviderSettingsList(
    filter?: SettingAnalyticsProviderFilter
  ): Promise<SettingAnalyticsProvider[]> {
    const data = await this.prisma.settingAnalyticsProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
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
    const returnValue = await this.prisma.settingAnalyticsProvider.create({
      data: output,
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

    const returnValue = await this.prisma.settingAnalyticsProvider.update({
      where: { id },
      data: filteredUpdateData,
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
