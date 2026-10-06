import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient, Setting } from '@prisma/client';
import {
  UpdateSettingInput,
  SettingFilter,
  SettingRestriction,
} from './settings.model';
import { checkSettingRestrictions } from './settings-utils';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { SettingDataloaderService } from './setting-dataloader.service';
import { SettingName } from './setting';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  SETTINGS_CACHE_NAMESPACE,
  SETTINGS_CACHE_TTL_SECONDS,
} from './settings-cache';

const KNOWN_SETTING_NAMES = new Set<string>(Object.values(SettingName));

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @PrimeDataLoader(SettingDataloaderService, 'name')
  async settingsList(filter?: SettingFilter): Promise<Setting[]> {
    return this.kv.getOrLoadNs(
      SETTINGS_CACHE_NAMESPACE,
      `list:${JSON.stringify(filter ?? {})}`,
      async () => {
        const data = await this.prisma.setting.findMany({
          where: filter,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return data.filter(setting => KNOWN_SETTING_NAMES.has(setting.name));
      },
      SETTINGS_CACHE_TTL_SECONDS
    );
  }

  @PrimeDataLoader(SettingDataloaderService, 'name')
  async setting(id: string): Promise<Setting> {
    const data = await this.prisma.setting.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      throw Error(`Setting with id ${id} not found`);
    }

    return data;
  }

  @PrimeDataLoader(SettingDataloaderService, 'name')
  async settingByName(name: string): Promise<Setting> {
    const data = await this.kv.getOrLoadNs(
      SETTINGS_CACHE_NAMESPACE,
      `name:${name}`,
      () =>
        this.prisma.setting.findUnique({
          where: {
            name,
          },
        }),
      SETTINGS_CACHE_TTL_SECONDS
    );

    if (!data) {
      throw Error(`Setting with name ${name} not found`);
    }

    return data;
  }

  @PrimeDataLoader(SettingDataloaderService, 'name')
  async updateSetting(input: UpdateSettingInput) {
    const { name, value } = input;
    const fullSetting = await this.prisma.setting.findUnique({
      where: { name },
    });

    if (!fullSetting) {
      throw new NotFoundException('setting', name);
    }

    const restriction = fullSetting.settingRestriction;
    checkSettingRestrictions(value, restriction as SettingRestriction);

    const updated = await this.prisma.setting.update({
      where: {
        name,
      },
      data: {
        value: value as unknown as Prisma.InputJsonValue,
      },
    });
    await this.kv.resetNamespace(SETTINGS_CACHE_NAMESPACE);

    return updated;
  }
}
