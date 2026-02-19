import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingTrackingPixel } from '@prisma/client';
import {
  CreateSettingTrackingPixelInput,
  UpdateSettingTrackingPixelInput,
  SettingTrackingPixelFilter,
} from './tracking-pixel-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { TrackingPixelSettingsDataloaderService } from './tracking-pixel-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './integrations/secrets-cryto';

@Injectable()
export class TrackingPixelSettingsService {
  private readonly crypto = new SecretCrypto();
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
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

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
  async trackingPixelSettingsList(
    filter?: SettingTrackingPixelFilter
  ): Promise<SettingTrackingPixel[]> {
    const data = await this.prisma.settingTrackingPixel.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
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

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
  async createTrackingPixelSetting(
    input: CreateSettingTrackingPixelInput
  ): Promise<SettingTrackingPixel> {
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = this.prisma.settingTrackingPixel.create({
      data: output,
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    return returnValue;
  }

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
  async updateTrackingPixelSetting(
    input: UpdateSettingTrackingPixelInput
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

    const returnValue = this.prisma.settingTrackingPixel.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    return returnValue;
  }

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
  async deleteTrackingPixelSetting(id: string): Promise<SettingTrackingPixel> {
    const existingSetting = await this.prisma.settingTrackingPixel.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Tracking Pixel Setting with id ${id} not found`
      );
    }

    const returnValue = this.prisma.settingTrackingPixel.delete({
      where: { id },
    });
    await this.kv.resetNamespace('settings:tracking-pixel');
    return returnValue;
  }
}
