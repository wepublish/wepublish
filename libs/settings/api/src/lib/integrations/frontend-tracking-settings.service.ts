import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  FrontendTrackingProviderType,
  PrismaClient,
  SettingFrontendTracking,
} from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  SettingFrontendTrackingFilter,
  UpdateSettingFrontendTrackingInput,
} from './frontend-tracking-settings.model';

@Injectable()
export class FrontendTrackingSettingsService implements OnModuleInit {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  async onModuleInit() {
    await this.initDatabaseConfiguration();
  }

  async initDatabaseConfiguration(): Promise<void> {
    for (const type of Object.values(FrontendTrackingProviderType)) {
      const existing = await this.prisma.settingFrontendTracking.findUnique({
        where: { type },
      });

      if (!existing) {
        await this.prisma.settingFrontendTracking.create({
          data: { type, active: false },
        });
      }
    }
  }

  async frontendTrackingSettingsList(
    filter?: SettingFrontendTrackingFilter
  ): Promise<SettingFrontendTracking[]> {
    return this.prisma.settingFrontendTracking.findMany({
      where: filter,
      orderBy: {
        type: 'asc',
      },
    });
  }

  async frontendTrackingSetting(id: string): Promise<SettingFrontendTracking> {
    const data = await this.prisma.settingFrontendTracking.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Frontend Tracking Setting with id ${id} not found`
      );
    }

    return data;
  }

  async activeFrontendTrackingProviders(): Promise<SettingFrontendTracking[]> {
    return this.prisma.settingFrontendTracking.findMany({
      where: { active: true },
      orderBy: { type: 'asc' },
    });
  }

  async updateFrontendTrackingSetting(
    input: UpdateSettingFrontendTrackingInput
  ): Promise<SettingFrontendTracking> {
    const { id, ...updateData } = input;

    const existingSetting =
      await this.prisma.settingFrontendTracking.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Frontend Tracking Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingFrontendTracking.update({
      where: { id },
      data: filteredUpdateData,
    });

    await this.kv.resetNamespace('settings:frontendtracking');

    return returnValue;
  }
}
