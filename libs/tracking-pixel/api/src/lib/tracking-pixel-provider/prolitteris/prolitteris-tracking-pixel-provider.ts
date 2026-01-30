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
    return this.prisma.settingTrackingPixel.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingTrackingPixel | null> {
    return this.kv.getOrLoadNs<SettingTrackingPixel | null>(
      `settings:prolitteris`,
      `${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingTrackingPixel | null> {
    return await this.getFromCache();
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
    return config.prolitteris_usePublisherInternalKey ?
        new InternalKey(
          config.prolitteris_memberNr,
          config.prolitteris_publisherInternalKeyDomain
        )
      : new GatewayClient(
          config.prolitteris_memberNr,
          config.prolitteris_username,
          config.prolitteris_password,
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
