import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  SettingSyncProvider,
  SyncProviderType,
} from '@prisma/client';
import {
  CreateSettingSyncProviderInput,
  UpdateSettingSyncProviderInput,
  SettingSyncProviderFilter,
} from './sync-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

@Injectable()
export class SyncProviderSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends { mailchimp_apiKey?: string | null },
  >(data: T): T {
    let result = { ...data };
    if (
      typeof data.mailchimp_apiKey === 'string' &&
      data.mailchimp_apiKey.length > 0
    ) {
      result = {
        ...result,
        mailchimp_apiKey: this.crypto.encrypt(data.mailchimp_apiKey),
      };
    }
    return result;
  }

  @PrimeDataLoader(SyncProviderSettingsDataloaderService, 'id')
  async syncProviderSettingsList(
    filter?: SettingSyncProviderFilter
  ): Promise<SettingSyncProvider[]> {
    return this.prisma.settingSyncProvider.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });
  }

  @PrimeDataLoader(SyncProviderSettingsDataloaderService, 'id')
  async syncProviderSetting(id: string): Promise<SettingSyncProvider> {
    const data = await this.prisma.settingSyncProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Sync Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(SyncProviderSettingsDataloaderService, 'id')
  async createSyncProviderSetting(
    input: CreateSettingSyncProviderInput
  ): Promise<SettingSyncProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingSyncProvider.create({
      data: output as any,
    });
    await this.kv.resetNamespace('settings:syncprovider');
    return returnValue;
  }

  @PrimeDataLoader(SyncProviderSettingsDataloaderService, 'id')
  async updateSyncProviderSetting(
    input: UpdateSettingSyncProviderInput
  ): Promise<SettingSyncProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;
    const existingSetting = await this.prisma.settingSyncProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Sync Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingSyncProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:syncprovider');
    return returnValue;
  }

  @PrimeDataLoader(SyncProviderSettingsDataloaderService, 'id')
  async deleteSyncProviderSetting(id: string): Promise<SettingSyncProvider> {
    const existingSetting = await this.prisma.settingSyncProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Sync Provider Setting with id ${id} not found`
      );
    }

    const returnValue = await this.prisma.settingSyncProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:syncprovider');
    return returnValue;
  }

  /**
   * Get all enabled sync provider settings with decrypted API keys.
   * Used by the sync executor.
   */
  async getEnabledSyncConfigs(): Promise<
    (SettingSyncProvider & { decryptedApiKey: string | null })[]
  > {
    const settings = await this.prisma.settingSyncProvider.findMany({
      where: { enabled: true },
    });

    return settings.map(setting => ({
      ...setting,
      decryptedApiKey:
        setting.mailchimp_apiKey ?
          this.crypto.decrypt(setting.mailchimp_apiKey)
        : null,
    }));
  }

  /**
   * Update the last sync result for a setting.
   */
  async updateSyncResult(id: string, error?: string): Promise<void> {
    await this.prisma.settingSyncProvider.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: error ?? null,
      },
    });
  }

  /**
   * Initialize a sync provider in the database if it doesn't exist.
   * Called on app startup from configuration.
   */
  async initDatabaseConfiguration(
    id: string,
    type: SyncProviderType
  ): Promise<void> {
    await this.prisma.settingSyncProvider.upsert({
      where: { id },
      create: { id, type },
      update: {},
    });
  }
}
