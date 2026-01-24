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

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(SettingDataloaderService, 'name')
  async settingsList(filter?: SettingFilter): Promise<Setting[]> {
    const data = await this.prisma.setting.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
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
    const data = await this.prisma.setting.findUnique({
      where: {
        name,
      },
    });

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

    return this.prisma.setting.update({
      where: {
        name,
      },
      data: {
        value: value as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
