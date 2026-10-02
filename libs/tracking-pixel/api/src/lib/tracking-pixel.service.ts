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
const ADDING_CLAIM_MS = 60_000;
const OTHER_REPLICA_WAIT_MS = 3000;
const OTHER_REPLICA_POLL_MS = 200;

export interface TrackingPixelModuleOptions {
  trackingPixelProviders: TrackingPixelProvider[];
}

@Injectable()
export class TrackingPixelService {
  private adding = new Map<string, Promise<void>>();

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
    const running = this.adding.get(articleId);

    if (running) {
      return running;
    }

    const adding = this.addMissing(articleId).finally(() =>
      this.adding.delete(articleId)
    );
    this.adding.set(articleId, adding);

    return adding;
  }

  private async addMissing(articleId: string) {
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

    if (
      (await this.kv.claim(`tracking-pixels:${articleId}`, ADDING_CLAIM_MS)) ===
      false
    ) {
      await this.waitForOtherReplica(checkedKey);

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
      const pixels = trackingPixels.filter(
        tp =>
          tp.trackingPixelMethod.trackingPixelProviderID ===
          trackingPixelProvider.id
      );
      const failedPixels = pixels.filter(tp => tp.error);

      if (pixels.some(tp => !tp.error)) {
        if (failedPixels.length) {
          changed = true;
          await this.deletePixels(failedPixels);
        }

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

      if (failedPixels.length) {
        await this.deletePixels(failedPixels);
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

  private async waitForOtherReplica(checkedKey: string) {
    for (
      let waited = 0;
      waited < OTHER_REPLICA_WAIT_MS;
      waited += OTHER_REPLICA_POLL_MS
    ) {
      await new Promise(resolve => setTimeout(resolve, OTHER_REPLICA_POLL_MS));

      if (await this.kv.getNs<boolean>(CHECKED_NAMESPACE, checkedKey)) {
        return;
      }
    }
  }

  private async deletePixels(pixels: Array<{ id: string }>) {
    await this.prisma.articleTrackingPixels.deleteMany({
      where: {
        id: { in: pixels.map(pixel => pixel.id) },
      },
    });
  }
}
