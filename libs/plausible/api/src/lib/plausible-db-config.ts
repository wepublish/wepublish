import { PrismaClient, AnalyticsProviderType } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { PlausibleConfig } from './plausible.service';

const DEFAULT_URL = 'https://plausible.io';

export class PlausibleDbConfig {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  /**
   * Initialize the database record if it doesn't exist
   */
  async initDatabaseConfiguration(): Promise<void> {
    await this.prisma.settingAnalyticsProvider.createMany({
      data: [
        {
          id: this.id,
          type: AnalyticsProviderType.PLAUSIBLE,
          name: 'Plausible',
          credentials: null,
          property: null,
          articlePrefix: '',
          url: null,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async loadPlausible(): Promise<PlausibleConfig> {
    await this.prisma.settingAnalyticsProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });

    const config = await this.prisma.settingAnalyticsProvider.findUnique({
      where: { id: this.id },
      select: {
        credentials: true,
        property: true,
        articlePrefix: true,
        url: true,
      },
    });

    let apiKey: string | undefined;

    if (config?.credentials) {
      try {
        apiKey = this.crypto.decrypt(config.credentials);
      } catch (e) {
        console.error(e);
        throw new Error(
          `Failed to decrypt credentials for Analytics setting ${this.id}`
        );
      }
    }

    return {
      apiKey,
      siteId: config?.property,
      articlePrefix: config?.articlePrefix ?? '/a',
      url: config?.url || DEFAULT_URL,
    };
  }

  async getPlausible(): Promise<PlausibleConfig> {
    return this.kv.getOrLoadNs<PlausibleConfig>(
      'settings:analyticsprovider',
      `${this.id}`,
      () => this.loadPlausible(),
      this.ttl
    );
  }
}
