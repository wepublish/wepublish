import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingMailProvider } from '@prisma/client';
import {
  CreateSettingMailProviderInput,
  UpdateSettingMailProviderInput,
  SettingMailProviderFilter,
} from './mail-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { MailProviderSettingsDataloaderService } from './mail-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

@Injectable()
export class MailProviderSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends { apiKey?: string | null; webhookEndpointSecret?: string | null },
  >(data: T): T {
    let encryptedApiKey;
    if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
      encryptedApiKey = this.crypto.encrypt(data.apiKey);
    }
    let encryptedWebhookEndpointSecret;
    if (
      typeof data.webhookEndpointSecret === 'string' &&
      data.webhookEndpointSecret.length > 0
    ) {
      encryptedWebhookEndpointSecret = this.crypto.encrypt(
        data.webhookEndpointSecret
      );
    }
    return {
      ...data,
      apiKey: encryptedApiKey,
      webhookEndpointSecret: encryptedWebhookEndpointSecret,
    };
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async mailProviderSettingsList(
    filter?: SettingMailProviderFilter
  ): Promise<SettingMailProvider[]> {
    const data = await this.prisma.settingMailProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async mailProviderSetting(id: string): Promise<SettingMailProvider> {
    const data = await this.prisma.settingMailProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Mail Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async createMailProviderSetting(
    input: CreateSettingMailProviderInput
  ): Promise<SettingMailProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingMailProvider.create({
      data: output,
    });
    await this.kv.resetNamespace('settings:mailprovider');
    return returnValue;
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async updateMailProviderSetting(
    input: UpdateSettingMailProviderInput
  ): Promise<SettingMailProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;
    const existingSetting = await this.prisma.settingMailProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Mail Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingMailProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:mailprovider');
    return returnValue;
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async deleteMailProviderSetting(id: string): Promise<SettingMailProvider> {
    const existingSetting = await this.prisma.settingMailProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Mail Provider Setting with id ${id} not found`
      );
    }

    const returnValue = await this.prisma.settingMailProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:mailprovider');
    return returnValue;
  }
}
