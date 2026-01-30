import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingAIProvider } from '@prisma/client';
import {
  CreateSettingAIProviderInput,
  UpdateSettingAIProviderInput,
  SettingAIProviderFilter,
} from './ai-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { AISettingsDataloaderService } from './ai-settings-dataloader.service';

@Injectable()
export class AISettingsService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async aiSettingsList(
    filter?: SettingAIProviderFilter
  ): Promise<SettingAIProvider[]> {
    const data = await this.prisma.settingAIProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async aiSetting(id: string): Promise<SettingAIProvider> {
    const data = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    return data;
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async createAISetting(
    input: CreateSettingAIProviderInput
  ): Promise<SettingAIProvider> {
    return this.prisma.settingAIProvider.create({
      data: input,
    });
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async updateAISetting(
    input: UpdateSettingAIProviderInput
  ): Promise<SettingAIProvider> {
    const { id, ...updateData } = input;

    const existingSetting = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    return this.prisma.settingAIProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
  }

  @PrimeDataLoader(AISettingsDataloaderService, 'id')
  async deleteAISetting(id: string): Promise<SettingAIProvider> {
    const existingSetting = await this.prisma.settingAIProvider.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(`AI Setting with id ${id} not found`);
    }

    return this.prisma.settingAIProvider.delete({
      where: { id },
    });
  }
}
