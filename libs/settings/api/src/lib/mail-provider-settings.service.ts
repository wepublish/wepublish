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

@Injectable()
export class MailProviderSettingsService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

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
    const returnValue = this.prisma.settingMailProvider.create({
      data: input,
    });
    await this.kv.resetNamespace('settings:mailprovider');
    return returnValue;
  }

  @PrimeDataLoader(MailProviderSettingsDataloaderService, 'id')
  async updateMailProviderSetting(
    input: UpdateSettingMailProviderInput
  ): Promise<SettingMailProvider> {
    const { id, ...updateData } = input;

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

    const returnValue = this.prisma.settingMailProvider.update({
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

    const returnValue = this.prisma.settingMailProvider.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:mailprovider');
    return returnValue;
  }
}
