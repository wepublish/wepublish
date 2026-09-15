import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingLetterProvider } from '@prisma/client';
import {
  CreateSettingLetterProviderInput,
  UpdateSettingLetterProviderInput,
  SettingLetterProviderFilter,
} from './letter-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { LetterProviderSettingsDataloaderService } from './letter-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

@Injectable()
export class LetterProviderSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends {
      clientSecret?: string | null;
      webhookSigningKey?: string | null;
    },
  >(data: T): T {
    let result = { ...data };
    if (typeof data.clientSecret === 'string' && data.clientSecret.length > 0) {
      result = {
        ...result,
        clientSecret: this.crypto.encrypt(data.clientSecret),
      };
    }
    if (
      typeof data.webhookSigningKey === 'string' &&
      data.webhookSigningKey.length > 0
    ) {
      result = {
        ...result,
        webhookSigningKey: this.crypto.encrypt(data.webhookSigningKey),
      };
    }
    return result;
  }

  @PrimeDataLoader(LetterProviderSettingsDataloaderService, 'id')
  async letterProviderSettingsList(
    filter?: SettingLetterProviderFilter
  ): Promise<SettingLetterProvider[]> {
    const data = await this.prisma.settingLetterProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(LetterProviderSettingsDataloaderService, 'id')
  async letterProviderSetting(id: string): Promise<SettingLetterProvider> {
    const data = await this.prisma.settingLetterProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Letter Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(LetterProviderSettingsDataloaderService, 'id')
  async createLetterProviderSetting(
    input: CreateSettingLetterProviderInput
  ): Promise<SettingLetterProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingLetterProvider.create({
      data: output,
    });
    await this.kv.resetNamespace('settings:letterprovider');
    return returnValue;
  }

  @PrimeDataLoader(LetterProviderSettingsDataloaderService, 'id')
  async updateLetterProviderSetting(
    input: UpdateSettingLetterProviderInput
  ): Promise<SettingLetterProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;
    const existingSetting = await this.prisma.settingLetterProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Letter Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingLetterProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:letterprovider');
    return returnValue;
  }

  @PrimeDataLoader(LetterProviderSettingsDataloaderService, 'id')
  async deleteLetterProviderSetting(
    id: string
  ): Promise<SettingLetterProvider> {
    const existingSetting = await this.prisma.settingLetterProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Letter Provider Setting with id ${id} not found`
      );
    }

    const returnValue = await this.prisma.settingLetterProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:letterprovider');
    return returnValue;
  }
}
