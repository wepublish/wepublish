import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ProviderSettingsChanged } from './provider-settings-changed';
import { clearProviderConfig } from './clear-provider-config';

export const PDF_RENDERER_SETTINGS_NAMESPACE = 'settings:pdfrenderer';

@Injectable()
export class PdfRendererSettingsService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private providerSettingsChanged: ProviderSettingsChanged
  ) {}

  private encryptSecretsIfPresent<
    T extends {
      cloudflare_apiToken?: string | null;
      gotenberg_password?: string | null;
    },
  >(data: T): T {
    const encrypted = { ...data };

    for (const field of [
      'cloudflare_apiToken',
      'gotenberg_password',
    ] as const) {
      const value = data[field];

      if (typeof value === 'string' && value.length > 0) {
        encrypted[field] = this.crypto.encrypt(value) as T[typeof field];
      }
    }

    return encrypted;
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
    await this.providerSettingsChanged.notify('Pdf renderer');
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

    const typeChanged =
      filteredUpdateData['type'] !== undefined &&
      filteredUpdateData['type'] !== existingSetting.type;

    const data =
      typeChanged ?
        {
          ...clearProviderConfig('SettingPdfRenderer'),
          type: filteredUpdateData['type'],
          ...('name' in filteredUpdateData ?
            { name: filteredUpdateData['name'] }
          : {}),
        }
      : filteredUpdateData;

    const returnValue = await this.prisma.settingPdfRenderer.update({
      where: { id },
      data,
    });
    await this.kv.resetNamespace(PDF_RENDERER_SETTINGS_NAMESPACE);
    await this.providerSettingsChanged.notify('Pdf renderer');
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

    if ((await this.prisma.settingPdfRenderer.count()) === 1) {
      throw new BadRequestException(
        `Pdf renderer ${id} is the only one configured and cannot be deleted. ` +
          `Create a replacement first, or change its type instead.`
      );
    }

    const returnValue = await this.prisma.settingPdfRenderer.delete({
      where: { id },
    });
    await this.kv.resetNamespace(PDF_RENDERER_SETTINGS_NAMESPACE);
    await this.providerSettingsChanged.notify('Pdf renderer');
    return returnValue;
  }
}
