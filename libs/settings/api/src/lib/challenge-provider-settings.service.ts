import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingChallengeProvider } from '@prisma/client';
import {
  CreateSettingChallengeProviderInput,
  UpdateSettingChallengeProviderInput,
  SettingChallengeProviderFilter,
} from './challenge-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { ChallengeProviderSettingsDataloaderService } from './challenge-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-cryto';

@Injectable()
export class ChallengeProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<T extends { secret?: string | null }>(
    data: T
  ): T {
    if (typeof data.secret === 'string' && data.secret.length > 0) {
      return {
        ...data,
        apiKey: this.crypto.encrypt(data.secret),
      };
    }
    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async challengeProviderSettingsList(
    filter?: SettingChallengeProviderFilter
  ): Promise<SettingChallengeProvider[]> {
    const data = await this.prisma.settingChallengeProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async challengeProviderSetting(
    id: string
  ): Promise<SettingChallengeProvider> {
    const data = await this.prisma.settingChallengeProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async createChallengeProviderSetting(
    input: CreateSettingChallengeProviderInput
  ): Promise<SettingChallengeProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const returnValue = this.prisma.settingChallengeProvider.create({
      data: data,
    });
    await this.kv.resetNamespace('settings:challenge');
    return returnValue;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async updateChallengeProviderSetting(
    input: UpdateSettingChallengeProviderInput
  ): Promise<SettingChallengeProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = data;

    const existingSetting =
      await this.prisma.settingChallengeProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = this.prisma.settingChallengeProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:challenge');
    return returnValue;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async deleteChallengeProviderSetting(
    id: string
  ): Promise<SettingChallengeProvider> {
    const existingSetting =
      await this.prisma.settingChallengeProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    const returnValue = this.prisma.settingChallengeProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:challenge');
    return returnValue;
  }
}
