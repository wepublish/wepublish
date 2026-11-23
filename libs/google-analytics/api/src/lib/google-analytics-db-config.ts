import { PrismaClient } from '@prisma/client';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { JWTInput } from 'google-auth-library';
import { GoogleAnalyticsConfig } from './google-analytics.service';

export class GoogleAnalyticsDbConfig {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: NamespacedCache,
    private readonly id: string
  ) {}

  private async loadGoogleAnalytics(): Promise<GoogleAnalyticsConfig> {
    // updateMany: the provider may not be set up (yet), which update would reject.
    await this.prisma.settingAnalyticsProvider.updateMany({
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
