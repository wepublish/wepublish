import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingAIProvider } from '@prisma/client';
import {
  CreateSettingAIProviderInput,
  UpdateSettingAIProviderInput,
  SettingAIProviderFilter,
} from './ai-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { AISettingsDataloaderService } from './ai-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

@Injectable()
export class AISettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<T extends { apiKey?: string | null }>(
    data: T
  ): T {
    if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
      return {
        ...data,
        apiKey: this.crypto.encrypt(data.apiKey),
      };
    }
    return data;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async aiSettingsList(
    filter?: SettingAIProviderFilter
  ): Promise<SettingAIProvider[]> {
    const data = await this.prisma.settingAIProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async aiSetting(id: string): Promise<SettingAIProvider> {
    const data = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    return data;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async createAISetting(
    input: CreateSettingAIProviderInput
  ): Promise<SettingAIProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingAIProvider.create({
      data,
    });
    await this.kv.resetNamespace('settings:ai');
    return returnValue;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async updateAISetting(
    input: UpdateSettingAIProviderInput
  ): Promise<SettingAIProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = data;

    const existingSetting = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    const returnValue = await this.prisma.settingAIProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:ai');
    return returnValue;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async deleteAISetting(id: string): Promise<SettingAIProvider> {
    const existingSetting = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    const returnValue = await this.prisma.settingAIProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:ai');
    return returnValue;
  }
}
