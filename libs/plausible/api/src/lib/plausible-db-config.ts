import { PrismaClient } from '@prisma/client';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { PlausibleConfig } from './plausible.service';

const DEFAULT_URL = 'https://plausible.io';

export class PlausibleDbConfig {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: NamespacedCache,
    private readonly id: string
  ) {}

  private async loadPlausible(): Promise<PlausibleConfig> {
    // updateMany: the provider may not be set up (yet), which update would reject.
    await this.prisma.settingAnalyticsProvider.updateMany({
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
