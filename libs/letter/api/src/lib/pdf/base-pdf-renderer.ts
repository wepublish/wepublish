import {
  PdfRendererType,
  PrismaClient,
  SettingPdfRenderer,
} from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  PDF_RENDERER_SETTINGS_NAMESPACE,
  SecretCrypto,
} from '@wepublish/settings/api';
import { PdfRenderer } from './pdf-renderer';

export interface PdfRendererProps {
  id: string;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
}

export abstract class BasePdfRenderer implements PdfRenderer {
  readonly id: string;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;

  protected constructor(props: PdfRendererProps) {
    this.id = props.id;
    this.prisma = props.prisma;
    this.kv = props.kv;
  }

  abstract render(html: string): Promise<Buffer>;

  async getConfig(): Promise<SettingPdfRenderer | null> {
    return await new PdfRendererConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
  }

  public async initDatabaseConfiguration(
    type: PdfRendererType,
    defaults?: Partial<
      Omit<
        SettingPdfRenderer,
        'id' | 'type' | 'createdAt' | 'modifiedAt' | 'lastLoadedAt'
      >
    >
  ): Promise<void> {
    await this.prisma.settingPdfRenderer.upsert({
      where: {
        id: this.id,
      },
      create: {
        id: this.id,
        type,
        ...defaults,
      },
      update: {},
    });
  }
}

class PdfRendererConfig {
  private readonly ttl = 21600;
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private decrypt(value: string | null, field: string): string | null {
    if (!value) {
      return null;
    }

    try {
      return this.crypto.decrypt(value);
    } catch (e) {
      console.error(e);
      throw new Error(
        `Failed to decrypt ${field} for Pdf renderer setting ${this.id}`
      );
    }
  }

  private async load(): Promise<SettingPdfRenderer | null> {
    const config = await this.prisma.settingPdfRenderer.findUnique({
      where: {
        id: this.id,
      },
    });

    if (!config) {
      return null;
    }

    await this.prisma.settingPdfRenderer.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });

    return {
      ...config,
      cloudflare_apiToken: this.decrypt(
        config.cloudflare_apiToken,
        'cloudflare_apiToken'
      ),
    };
  }

  async getConfig(): Promise<SettingPdfRenderer | null> {
    return this.kv.getOrLoadNs<SettingPdfRenderer | null>(
      PDF_RENDERER_SETTINGS_NAMESPACE,
      `${this.id}`,
      () => this.load(),
      this.ttl
    );
  }
}
