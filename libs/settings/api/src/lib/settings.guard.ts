import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SETTINGS_METADATA_KEY } from './settings.decorator';
import { PrismaClient } from '@prisma/client';
import { SettingName } from './setting';

@Injectable()
export class SettingsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaClient
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const settings = this.reflector.getAllAndMerge<SettingName[]>(
      SETTINGS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!settings.length) {
      return true;
    }

    const settingList = await this.prisma.setting.findMany({
      where: {
        name: {
          in: settings,
        },
      },
    });

    return (
      Boolean(settingList.length) &&
      settingList.some(setting => !!setting.value)
    );
  }
}
