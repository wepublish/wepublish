import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, SettingSparkloop } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { UpdateSettingSparkloopInput } from './sparkloop-settings.model';

const SPARKLOOP_SINGLETON_ID = 'singleton';

@Injectable()
export class SparkloopSettingsService implements OnModuleInit {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  async onModuleInit() {
    await this.initDatabaseConfiguration();
  }

  async initDatabaseConfiguration(): Promise<void> {
    const existing = await this.prisma.settingSparkloop.findUnique({
      where: { id: SPARKLOOP_SINGLETON_ID },
    });

    if (!existing) {
      await this.prisma.settingSparkloop.create({
        data: { id: SPARKLOOP_SINGLETON_ID, active: false },
      });
    }
  }

  async sparkloopSettings(): Promise<SettingSparkloop | null> {
    return this.prisma.settingSparkloop.findUnique({
      where: { id: SPARKLOOP_SINGLETON_ID },
    });
  }

  async activeSparkloopSettings(): Promise<SettingSparkloop | null> {
    return this.prisma.settingSparkloop.findFirst({
      where: { id: SPARKLOOP_SINGLETON_ID, active: true },
    });
  }

  async updateSparkloopSettings(
    input: UpdateSettingSparkloopInput
  ): Promise<SettingSparkloop> {
    const filteredUpdateData = Object.fromEntries(
      Object.entries(input).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingSparkloop.update({
      where: { id: SPARKLOOP_SINGLETON_ID },
      data: filteredUpdateData,
    });

    await this.kv.resetNamespace('settings:sparkloop');

    return returnValue;
  }
}
