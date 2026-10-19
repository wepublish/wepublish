import { PrismaClient, AnalyticsProviderType } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { UmamiConfig } from './umami.service';

const DEFAULT_URL = 'https://api.umami.is/v1';

export class UmamiDbConfig {
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
          type: AnalyticsProviderType.UMAMI,
          name: 'Umami',
          credentials: null,
          property: null,
          articlePrefix: '',
          url: null,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async loadUmami(): Promise<UmamiConfig> {
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
      websiteId: config?.property,
      articlePrefix: config?.articlePrefix ?? '/a',
      url: config?.url || DEFAULT_URL,
    };
  }

  async getUmami(): Promise<UmamiConfig> {
    return this.kv.getOrLoadNs<UmamiConfig>(
      'settings:analyticsprovider',
      `${this.id}`,
      () => this.loadUmami(),
      this.ttl
    );
  }
}
