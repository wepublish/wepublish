import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { TrackingPixelProvider } from './tracking-pixel-provider/tracking-pixel-provider';

export const TRACKING_PIXEL_MODULE_OPTIONS = 'TRACKING_PIXEL_MODULE_OPTIONS';

const CHECKED_NAMESPACE = 'tracking-pixels';
const CHECKED_TTL_SECONDS = 24 * 60 * 60;
const RETRY_FAILED_SECONDS = 15 * 60;

export interface TrackingPixelModuleOptions {
  trackingPixelProviders: TrackingPixelProvider[];
}

@Injectable()
export class TrackingPixelService {
  constructor(
    private prisma: PrismaClient,
    @Inject(TRACKING_PIXEL_MODULE_OPTIONS)
    private config: TrackingPixelModuleOptions,
    private kv: KvTtlCacheService
  ) {}

  async getArticlePixels(
    articleId: string
  ): Promise<Prisma.ArticleTrackingPixelsCreateManyInput[]> {
    const trackingPixels: Prisma.ArticleTrackingPixelsCreateManyInput[] = [];

    for (const trackingPixelProvider of this.config.trackingPixelProviders) {
      const trackingPixelMethod = await this.prisma.trackingPixelMethod.upsert({
        where: {
          trackingPixelProviderID: trackingPixelProvider.id,
        },
        create: {
          trackingPixelProviderID: trackingPixelProvider.id,
          trackingPixelProviderType:
            await trackingPixelProvider.getTrackingPixelType(),
        },
        update: {},
      });

      try {
        const trackingPixel = await trackingPixelProvider.createPixelUri(
          `A${articleId}`
        );

        trackingPixels.push({
          articleId,
          tackingPixelMethodID: trackingPixelMethod.id,
          uri: trackingPixel.uri,
          pixelUid: trackingPixel.pixelUid,
        });
      } catch (error: any) {
        trackingPixels.push({
          articleId,
          tackingPixelMethodID: trackingPixelMethod.id,
          uri: null,
          pixelUid: null,
          error: JSON.stringify(error.message),
        });
      }
    }

    return trackingPixels;
  }

  async addMissingArticleTrackingPixels(articleId: string) {
    const providers = this.config.trackingPixelProviders;

    if (!providers.length) {
      return;
    }

    const checkedKey = `${providers
      .map(provider => provider.id)
      .sort()
      .join(',')}:${articleId}`;

    if (await this.kv.getNs<boolean>(CHECKED_NAMESPACE, checkedKey)) {
      return;
    }

    let failed = false;
    let changed = false;
    const trackingPixels = await this.prisma.articleTrackingPixels.findMany({
      where: {
        articleId,
      },
      include: {
        trackingPixelMethod: true,
      },
    });

    for (const trackingPixelProvider of this.config.trackingPixelProviders) {
      const matchingPixel = trackingPixels.find(
        tp =>
          tp.trackingPixelMethod.trackingPixelProviderID ===
          trackingPixelProvider.id
      );

      if (matchingPixel && !matchingPixel.error) {
        continue;
      }

      changed = true;

      const trackingPixelMethod = await this.prisma.trackingPixelMethod.upsert({
        where: {
          trackingPixelProviderID: trackingPixelProvider.id,
        },
        create: {
          trackingPixelProviderID: trackingPixelProvider.id,
          trackingPixelProviderType:
            await trackingPixelProvider.getTrackingPixelType(),
        },
        update: {},
      });

      if (matchingPixel) {
        await this.prisma.articleTrackingPixels.deleteMany({
          where: {
            id: matchingPixel.id,
          },
        });
      }

      try {
        const trackingPixel = await trackingPixelProvider.createPixelUri(
          `A${articleId}`
        );

        await this.prisma.articleTrackingPixels.create({
          data: {
            articleId,
            tackingPixelMethodID: trackingPixelMethod.id,
            uri: trackingPixel.uri,
            pixelUid: trackingPixel.pixelUid,
          },
        });
      } catch (error: any) {
        failed = true;
        await this.prisma.articleTrackingPixels.create({
          data: {
            articleId,
            tackingPixelMethodID: trackingPixelMethod.id,
            uri: null,
            pixelUid: null,
            error: JSON.stringify(error.message),
          },
        });
      }
    }

    if (changed) {
      await this.kv.delNs(
        contentCacheNamespace('articles'),
        `tracking-pixels:${articleId}`
      );
    }

    await this.kv.setNs(
      CHECKED_NAMESPACE,
      checkedKey,
      true,
      failed ? RETRY_FAILED_SECONDS : CHECKED_TTL_SECONDS
    );
  }
}
