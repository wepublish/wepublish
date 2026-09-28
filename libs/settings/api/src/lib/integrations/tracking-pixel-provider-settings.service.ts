import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingTrackingPixel } from '@prisma/client';
import {
  CreateSettingTrackingPixelProviderInput,
  UpdateSettingTrackingPixelProviderInput,
  SettingTrackingPixelFilter,
} from './tracking-pixel-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { TrackingPixelSettingsProviderDataloaderService } from './tracking-pixel-settings-provider-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';
import { ProviderSettingsChanged } from './provider-settings-changed';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class TrackingPixelProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  private readonly logger = new Logger(
    TrackingPixelProviderSettingsService.name
  );
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private providerSettingsChanged: ProviderSettingsChanged
  ) {}

  private encryptSecretsIfPresent<
    T extends { prolitteris_password?: string | null },
  >(data: T): T {
    if (
      typeof data.prolitteris_password === 'string' &&
      data.prolitteris_password.length > 0
    ) {
      return {
        ...data,
        prolitteris_password: this.crypto.encrypt(data.prolitteris_password),
      };
    }
    return data;
  }

  @PrimeDataLoader(TrackingPixelSettingsProviderDataloaderService, 'id')
  async trackingPixelSettingsList(
    filter?: SettingTrackingPixelFilter
  ): Promise<SettingTrackingPixel[]> {
    const data = await this.prisma.settingTrackingPixel.findMany({
      where: { ...filter, deletedAt: null },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(TrackingPixelSettingsProviderDataloaderService, 'id')
  async trackingPixelSetting(id: string): Promise<SettingTrackingPixel> {
    const data = await this.prisma.settingTrackingPixel.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Tracking Pixel Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(TrackingPixelSettingsProviderDataloaderService, 'id')
  async createTrackingPixelSetting(
    input: CreateSettingTrackingPixelProviderInput
  ): Promise<SettingTrackingPixel> {
    const output = this.encryptSecretsIfPresent(input);

    const returnValue = await this.prisma.settingTrackingPixel.upsert({
      where: { id: output.id },
      create: output,
      update: { deletedAt: null },
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    await this.providerSettingsChanged.notify('Tracking pixel provider');
    return returnValue;
  }

  @PrimeDataLoader(TrackingPixelSettingsProviderDataloaderService, 'id')
  async updateTrackingPixelSetting(
    input: UpdateSettingTrackingPixelProviderInput
  ): Promise<SettingTrackingPixel> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;

    const existingSetting = await this.prisma.settingTrackingPixel.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Tracking Pixel Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingTrackingPixel.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    await this.providerSettingsChanged.notify('Tracking pixel provider');
    return returnValue;
  }

  @PrimeDataLoader(TrackingPixelSettingsProviderDataloaderService, 'id')
  async deleteTrackingPixelSetting(id: string): Promise<SettingTrackingPixel> {
    const existingSetting = await this.prisma.settingTrackingPixel.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Tracking Pixel Setting with id ${id} not found`
      );
    }

    const usage = await this.countUsage(id);

    if (usage) {
      const message =
        `Tracking pixel provider ${id} was deleted while still used by ${usage} article pixel(s). ` +
        `It keeps running so existing records stay intact, but it is no longer offered.`;

      this.logger.warn(message);
      Sentry.captureMessage(message, 'warning');
    }

    const returnValue = await this.prisma.settingTrackingPixel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    await this.providerSettingsChanged.notify('Tracking pixel provider');
    return returnValue;
  }

  private async countUsage(id: string): Promise<number> {
    const method = await this.prisma.trackingPixelMethod.findUnique({
      where: { trackingPixelProviderID: id },
      select: { id: true },
    });

    if (!method) {
      return 0;
    }

    return this.prisma.articleTrackingPixels.count({
      where: { tackingPixelMethodID: method.id },
    });
  }
}
