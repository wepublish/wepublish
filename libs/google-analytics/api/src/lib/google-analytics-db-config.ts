import { PrismaClient, AnalyticsProviderType } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { JWTInput } from 'google-auth-library';
import { GoogleAnalyticsConfig } from './google-analytics.service';

export class GoogleAnalyticsDbConfig {
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
    const existing = await this.prisma.settingAnalyticsProvider.findUnique({
      where: { id: this.id },
    });

    if (!existing) {
      await this.prisma.settingAnalyticsProvider.create({
        data: {
          id: this.id,
          type: AnalyticsProviderType.GOOGLE,
          name: 'Google Analytics',
          credentials: null,
          property: null,
          articlePrefix: '',
        },
      });
    }
  }

  private async loadGoogleAnalytics(): Promise<GoogleAnalyticsConfig> {
    await this.prisma.settingAnalyticsProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });

    const config = await this.prisma.settingAnalyticsProvider.findUnique({
      where: { id: this.id },
      select: { credentials: true, property: true, articlePrefix: true },
    });

    let decryptedCredentials: JWTInput | undefined;

    if (config?.credentials) {
      try {
        const decrypted = this.crypto.decrypt(config.credentials);
        decryptedCredentials = JSON.parse(decrypted) as JWTInput;
      } catch (e) {
        console.error(e);
        throw new Error(
          `Failed to decrypt credentials for Analytics setting ${this.id}`
        );
      }
    }

    return {
      credentials: decryptedCredentials,
      property: config?.property,
      articlePrefix: config?.articlePrefix ?? '/a',
    };
  }

  async getGoogleAnalytics(): Promise<GoogleAnalyticsConfig> {
    return this.kv.getOrLoadNs<GoogleAnalyticsConfig>(
      'settings:analyticsprovider',
      `${this.id}`,
      () => this.loadGoogleAnalytics(),
      this.ttl
    );
  }
}
