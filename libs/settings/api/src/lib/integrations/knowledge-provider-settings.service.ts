import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingKnowledgeProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrimeDataLoader } from '@wepublish/utils/api';

import { KnowledgeProviderSettingsDataloaderService } from './knowledge-provider-settings-dataloader.service';
import {
  SettingKnowledgeProviderFilter,
  UpdateSettingKnowledgeProviderInput,
} from './knowledge-provider-settings.model';
import { SecretCrypto } from './secrets-crypto';

/** Reset by every update; read by the knowledge provider client. */
export const KNOWLEDGE_PROVIDER_CACHE_NAMESPACE = 'settings:knowledge-provider';

@Injectable()
export class KnowledgeProviderSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @PrimeDataLoader(KnowledgeProviderSettingsDataloaderService, 'id')
  async knowledgeProviderSettingsList(
    filter?: SettingKnowledgeProviderFilter
  ): Promise<SettingKnowledgeProvider[]> {
    return this.prisma.settingKnowledgeProvider.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });
  }

  @PrimeDataLoader(KnowledgeProviderSettingsDataloaderService, 'id')
  async knowledgeProviderSetting(
    id: string
  ): Promise<SettingKnowledgeProvider> {
    const data = await this.prisma.settingKnowledgeProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(`Knowledge provider setting ${id} not found`);
    }

    return data;
  }

  @PrimeDataLoader(KnowledgeProviderSettingsDataloaderService, 'id')
  async updateKnowledgeProviderSetting(
    input: UpdateSettingKnowledgeProviderInput
  ): Promise<SettingKnowledgeProvider> {
    const { id, token, ...rest } = input;

    const existing = await this.prisma.settingKnowledgeProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Knowledge provider setting ${id} not found`);
    }

    // An empty token means "keep the stored one": the form never shows it,
    // so it cannot send it back.
    const data = Object.fromEntries(
      Object.entries({
        ...rest,
        token: token ? this.crypto.encrypt(token) : undefined,
      }).filter(([, value]) => value !== undefined)
    );

    const updated = await this.prisma.settingKnowledgeProvider.update({
      where: { id },
      data,
    });
    await this.kv.resetNamespace(KNOWLEDGE_PROVIDER_CACHE_NAMESPACE);

    return updated;
  }
}
