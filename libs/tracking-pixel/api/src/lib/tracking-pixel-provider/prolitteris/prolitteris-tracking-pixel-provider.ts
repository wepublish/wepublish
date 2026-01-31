import {
  PrismaClient,
  SettingTrackingPixel,
  TrackingPixelProviderType,
} from '@prisma/client';
import { PixelUrl, TrackingPixelProvider } from '../tracking-pixel-provider';
import { GatewayClient } from './client-gateway';
import { InternalKey } from './internalKey';
import { HttpService } from '@nestjs/axios';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { ProLitterisGenerator } from './types';

class ProlitterisConfig {
  private readonly ttl = 21600; // 6h

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingTrackingPixel | null> {
    await this.prisma.settingTrackingPixel.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });
    return this.prisma.settingTrackingPixel.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingTrackingPixel | null> {
    return this.kv.getOrLoadNs<SettingTrackingPixel | null>(
      `settings:tracking-pixel`,
      `${this.id}`,
      () => this.load(),
      this.ttl
    );
  }
  private assertConfig(
    config: SettingTrackingPixel | null
  ): asserts config is SettingTrackingPixel {
    if (!config)
      throw new Error(`PaymentProvider config missing for ${this.id}`);
  }

  async getConfig(): Promise<SettingTrackingPixel> {
    const config = await this.getFromCache();
    this.assertConfig(config);
    return config;
  }
}

export class ProlitterisTrackingPixelProvider implements TrackingPixelProvider {
  constructor(
    public readonly id: string,
    public prisma: PrismaClient,
    public kv: KvTtlCacheService,
    private httpClient: HttpService
  ) {}

  async getKeyGenerator(): Promise<ProLitterisGenerator> {
    const config = await new ProlitterisConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    return (
        this.assertProperty(
          'prolitteris_usePublisherInternalKey',
          config.prolitteris_usePublisherInternalKey
        )
      ) ?
        new InternalKey(
          this.assertProperty(
            'prolitteris_memberNr',
            config.prolitteris_memberNr
          ),
          this.assertProperty(
            'prolitteris_publisherInternalKeyDomain',
            config.prolitteris_publisherInternalKeyDomain
          )
        )
      : new GatewayClient(
          this.assertProperty(
            'prolitteris_memberNr',
            config.prolitteris_memberNr
          ),
          this.assertProperty(
            'prolitteris_username',
            config.prolitteris_username
          ),
          this.assertProperty(
            'prolitteris_password',
            config.prolitteris_password
          ),
          this.httpClient
        );
  }

  async getTrackingPixelType(): Promise<TrackingPixelProviderType> {
    const config = await new ProlitterisConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    return config.type;
  }

  async getPaidContentIndicator(): Promise<string> {
    const config = await new ProlitterisConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    return config.prolitteris_onlyPaidContentAccess ? 'pw' : 'na';
  }

  async createPixelUri(internalTrackingId: string): Promise<PixelUrl> {
    const keyGenerator = await this.getKeyGenerator();
    const trackingPixels =
      await keyGenerator.getTrackingPixels(internalTrackingId);
    const paidContentIndicator = await this.getPaidContentIndicator();
    return {
      pixelUid: trackingPixels.pixelUids[0],
      uri: `https://${trackingPixels.domain}/${paidContentIndicator}/${trackingPixels.pixelUids[0]}`,
    };
  }

  private assertProperty<T>(
    propertyName: string,
    property: T | null | undefined
  ): T {
    if (property == null) {
      throw new Error(
        `TrackingpixelProvider missing property ${propertyName}=${property} for ${this.id}`
      );
    }
    return property;
  }

  public async initDatabaseConfiguration(
    id: string,
    type: TrackingPixelProviderType
  ): Promise<void> {
    await this.prisma.settingTrackingPixel.upsert({
      where: {
        id,
      },
      create: {
        id,
        type,
      },
      update: {},
    });
    return;
  }
}
