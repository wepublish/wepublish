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
import { PdfRenderer, PdfRendererError } from './pdf-renderer';

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

  /**
   * Posts to the renderer and returns the pdf, turning every way that can go
   * wrong into a `PdfRendererError`.
   */
  protected async fetchPdf(url: string, init: RequestInit): Promise<Buffer> {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (error) {
      throw new PdfRendererError(
        `Could not reach the pdf renderer: ${(error as Error).message}`
      );
    }

    if (!response.ok) {
      throw new PdfRendererError(await this.describeFailure(response));
    }

    const pdf = Buffer.from(await response.arrayBuffer());

    // A json body where a pdf is expected means the endpoint reported a problem
    // with a 200, which would otherwise be printed and posted as a broken file.
    if (!pdf.subarray(0, 5).toString('latin1').startsWith('%PDF-')) {
      throw new PdfRendererError(
        `The pdf renderer did not return a pdf: ${pdf
          .subarray(0, 200)
          .toString('utf8')}`
      );
    }

    return pdf;
  }

  private async describeFailure(response: Response): Promise<string> {
    const retryAfter = response.headers.get('retry-after');
    const body = await response.text().catch(() => '');
    const reason =
      response.status === 429 ?
        `the rate limit was reached${
          retryAfter ? `, retry after ${retryAfter}s` : ''
        }`
      : `status ${response.status}`;

    return `The pdf renderer refused the request (${reason}): ${body.slice(
      0,
      300
    )}`;
  }

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
      gotenberg_password: this.decrypt(
        config.gotenberg_password,
        'gotenberg_password'
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
