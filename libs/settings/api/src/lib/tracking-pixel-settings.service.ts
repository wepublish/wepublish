import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingTrackingPixel } from '@prisma/client';
import {
  CreateSettingTrackingPixelInput,
  UpdateSettingTrackingPixelInput,
  SettingTrackingPixelFilter,
} from './tracking-pixel-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { TrackingPixelSettingsDataloaderService } from './tracking-pixel-settings-dataloader.service';

@Injectable()
export class TrackingPixelSettingsService {
  constructor(private prisma: PrismaClient) {}

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
    return this.prisma.settingTrackingPixel.create({
      data: input,
    });
  }

  @PrimeDataLoader(TrackingPixelSettingsDataloaderService, 'id')
  async updateTrackingPixelSetting(
    input: UpdateSettingTrackingPixelInput
  ): Promise<SettingTrackingPixel> {
    const { id, ...updateData } = input;

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

    return this.prisma.settingTrackingPixel.update({
      where: { id },
      data: filteredUpdateData,
    });
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

    return this.prisma.settingTrackingPixel.delete({
      where: { id },
    });
  }
}
