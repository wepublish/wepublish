import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingPdfRenderer } from '@prisma/client';
import {
  CreateSettingPdfRendererInput,
  UpdateSettingPdfRendererInput,
  SettingPdfRendererFilter,
} from './pdf-renderer-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PdfRendererSettingsDataloaderService } from './pdf-renderer-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';

export const PDF_RENDERER_SETTINGS_NAMESPACE = 'settings:pdfrenderer';

@Injectable()
export class PdfRendererSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  private encryptSecretsIfPresent<
    T extends {
      cloudflare_apiToken?: string | null;
    },
  >(data: T): T {
    if (
      typeof data.cloudflare_apiToken === 'string' &&
      data.cloudflare_apiToken.length > 0
    ) {
      return {
        ...data,
        cloudflare_apiToken: this.crypto.encrypt(data.cloudflare_apiToken),
      };
    }
    return data;
  }

  @PrimeDataLoader(PdfRendererSettingsDataloaderService, 'id')
  async pdfRendererSettingsList(
    filter?: SettingPdfRendererFilter
  ): Promise<SettingPdfRenderer[]> {
    const data = await this.prisma.settingPdfRenderer.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(PdfRendererSettingsDataloaderService, 'id')
  async pdfRendererSetting(id: string): Promise<SettingPdfRenderer> {
    const data = await this.prisma.settingPdfRenderer.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Pdf Renderer Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(PdfRendererSettingsDataloaderService, 'id')
  async createPdfRendererSetting(
    input: CreateSettingPdfRendererInput
  ): Promise<SettingPdfRenderer> {
    const output = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingPdfRenderer.create({
      data: output,
    });
    await this.kv.resetNamespace(PDF_RENDERER_SETTINGS_NAMESPACE);
    return returnValue;
  }

  @PrimeDataLoader(PdfRendererSettingsDataloaderService, 'id')
  async updatePdfRendererSetting(
    input: UpdateSettingPdfRendererInput
  ): Promise<SettingPdfRenderer> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;
    const existingSetting = await this.prisma.settingPdfRenderer.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Pdf Renderer Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingPdfRenderer.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace(PDF_RENDERER_SETTINGS_NAMESPACE);
    return returnValue;
  }

  @PrimeDataLoader(PdfRendererSettingsDataloaderService, 'id')
  async deletePdfRendererSetting(id: string): Promise<SettingPdfRenderer> {
    const existingSetting = await this.prisma.settingPdfRenderer.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      throw new NotFoundException(
        `Pdf Renderer Setting with id ${id} not found`
      );
    }

    const returnValue = await this.prisma.settingPdfRenderer.delete({
      where: { id },
    });
    await this.kv.resetNamespace(PDF_RENDERER_SETTINGS_NAMESPACE);
    return returnValue;
  }
}
