import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { TrackingPixelProvider } from './tracking-pixel-provider/tracking-pixel-provider';

export const TRACKING_PIXEL_MODULE_OPTIONS = 'TRACKING_PIXEL_MODULE_OPTIONS';

export interface TrackingPixelModuleOptions {
  trackingPixelProviders: TrackingPixelProvider[];
}

@Injectable()
export class TrackingPixelService {
  constructor(
    private prisma: PrismaClient,
    @Inject(TRACKING_PIXEL_MODULE_OPTIONS)
    private config: TrackingPixelModuleOptions
  ) {}

  async getArticlePixels(
    articleId: string
  ): Promise<Prisma.ArticleTrackingPixelsCreateManyInput[]> {
    const trackingPixels: Prisma.ArticleTrackingPixelsCreateManyInput[] = [];

    for (const trackingPixelProvider of this.config.trackingPixelProviders) {
      const tackingPixelMethode = await this.prisma.trackingPixelMethod.upsert({
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
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: trackingPixel.uri,
          pixelUid: trackingPixel.pixelUid,
        });
      } catch (error: any) {
        trackingPixels.push({
          articleId,
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: null,
          pixelUid: null,
          error: JSON.stringify(error.message),
        });
      }
    }

    return trackingPixels;
  }

  async addMissingArticleTrackingPixels(articleId: string) {
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

      const tackingPixelMethode = await this.prisma.trackingPixelMethod.upsert({
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
        await this.prisma.articleTrackingPixels.delete({
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
            tackingPixelMethodID: tackingPixelMethode.id,
            uri: trackingPixel.uri,
            pixelUid: trackingPixel.pixelUid,
          },
        });
      } catch (error: any) {
        await this.prisma.articleTrackingPixels.create({
          data: {
            articleId,
            tackingPixelMethodID: tackingPixelMethode.id,
            uri: null,
            pixelUid: null,
            error: JSON.stringify(error.message),
          },
        });
      }
    }
  }
}
