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
  MailchimpMapping,
  MailchimpMappingInput,
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
    const { id, mailchimpMappings, ...updateData } = output;
    const existingSetting = await this.prisma.settingSyncProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Sync Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(
        ([_, value]) => value !== undefined && value !== null
      )
    );

    const returnValue = await this.prisma.settingSyncProvider.update({
      where: { id },
      data: filteredUpdateData,
    });

    if (mailchimpMappings !== undefined) {
      await this.saveMailchimpMappings(id, mailchimpMappings);
    }

    await this.kv.resetNamespace('settings:syncprovider');
    return returnValue;
  }

  /**
   * Return the per-member-plan Mailchimp mappings for a sync provider.
   */
  async getMailchimpMappings(
    syncProviderId: string
  ): Promise<MailchimpMapping[]> {
    const mappings = await this.prisma.mailchimpMapping.findMany({
      where: { syncProviderId },
    });

    return mappings.map(mapping => ({
      memberPlanId: mapping.memberPlanId,
      activeFieldIds: (mapping.activeFieldIds as string[]) ?? [],
      retargetFieldIds: (mapping.retargetFieldIds as string[]) ?? [],
      retargetDelayDays: mapping.retargetDelayDays,
      interestGroupIds: (mapping.interestGroupIds as string[]) ?? [],
    }));
  }

  /**
   * Replace the per-member-plan Mailchimp mappings for a sync provider with the
   * provided set. Mappings for member plans not included are removed.
   */
  private async saveMailchimpMappings(
    syncProviderId: string,
    mappings: MailchimpMappingInput[]
  ): Promise<void> {
    const memberPlanIds = mappings.map(mapping => mapping.memberPlanId);

    await this.prisma.$transaction([
      this.prisma.mailchimpMapping.deleteMany({
        where: { syncProviderId, memberPlanId: { notIn: memberPlanIds } },
      }),
      ...mappings.map(mapping => {
        const data = {
          activeFieldIds: mapping.activeFieldIds ?? [],
          retargetFieldIds: mapping.retargetFieldIds ?? [],
          retargetDelayDays: mapping.retargetDelayDays ?? 30,
          interestGroupIds: mapping.interestGroupIds ?? [],
        };

        return this.prisma.mailchimpMapping.upsert({
          where: {
            syncProviderId_memberPlanId: {
              syncProviderId,
              memberPlanId: mapping.memberPlanId,
            },
          },
          create: {
            syncProviderId,
            memberPlanId: mapping.memberPlanId,
            ...data,
          },
          update: data,
        });
      }),
    ]);
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
