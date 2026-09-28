import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ProviderSettingsChanged } from './provider-settings-changed';
import { clearProviderConfig } from './clear-provider-config';

@Injectable()
export class MailProviderSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private providerSettingsChanged: ProviderSettingsChanged
  ) {}

  private encryptSecretsIfPresent<
    T extends { apiKey?: string | null; webhookEndpointSecret?: string | null },
  >(data: T): T {
    let result = { ...data };
    if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
      result = { ...result, apiKey: this.crypto.encrypt(data.apiKey) };
    }
    if (
      typeof data.webhookEndpointSecret === 'string' &&
      data.webhookEndpointSecret.length > 0
    ) {
      result = {
        ...result,
        webhookEndpointSecret: this.crypto.encrypt(data.webhookEndpointSecret),
      };
    }
    return result;
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
    await this.providerSettingsChanged.notify('Mail provider');
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

    const typeChanged =
      filteredUpdateData['type'] !== undefined &&
      filteredUpdateData['type'] !== existingSetting.type;

    const data =
      typeChanged ?
        {
          ...clearProviderConfig('SettingMailProvider'),
          type: filteredUpdateData['type'],
          ...('name' in filteredUpdateData ?
            { name: filteredUpdateData['name'] }
          : {}),
        }
      : filteredUpdateData;

    const returnValue = await this.prisma.settingMailProvider.update({
      where: { id },
      data,
    });

    await this.kv.resetNamespace('settings:mailprovider');
    await this.providerSettingsChanged.notify('Mail provider');
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

    if ((await this.prisma.settingMailProvider.count()) === 1) {
      throw new BadRequestException(
        `Mail provider ${id} is the only one configured and cannot be deleted. ` +
          `Create a replacement first, or change its type instead.`
      );
    }

    const returnValue = await this.prisma.settingMailProvider.delete({
      where: { id },
    });

    await this.kv.resetNamespace('settings:mailprovider');
    await this.providerSettingsChanged.notify('Mail provider');
    return returnValue;
  }
}
