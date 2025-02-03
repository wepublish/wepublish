import {TrackingPixelProvider} from '@wepublish/tracking-pixel/api'
import {Prisma, TrackingPixelMethod, PrismaClient, TrackingPixelProviderType} from '@prisma/client'

export class TrackingPixelContext {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelProviders: TrackingPixelProvider[]
  ) {}
  async getArticlePixels(
    articleId: string
  ): Promise<Prisma.ArticleTrackingPixelsCreateManyInput[]> {
    const trackingPixels: Prisma.ArticleTrackingPixelsCreateManyInput[] = []
    for (const trackingPixelProvider of this.trackingPixelProviders) {
      const tackingPixelMethode = await this.findOrCreateMethode(
        trackingPixelProvider.id,
        trackingPixelProvider.type
      )
      try {
        const trackingPixel = await trackingPixelProvider.createPixelUri({
          internalTrackingId: `A${articleId}`
        })
        trackingPixels.push({
          articleId,
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: trackingPixel.uri,
          pixelUid: trackingPixel.pixelUid
        })
      } catch (error) {
        trackingPixels.push({
          articleId,
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: null,
          pixelUid: null,
          error: JSON.stringify(error.message)
        })
      }
    }
    return trackingPixels
  }

  async findOrCreateMethode(
    trackingPixelProviderID: string,
    trackingPixelProviderType: TrackingPixelProviderType
  ): Promise<TrackingPixelMethod> {
    const tackingPixelMethode = await this.prisma.trackingPixelMethod.findUnique({
      where: {
        trackingPixelProviderID
      }
    })
    if (tackingPixelMethode) {
      return tackingPixelMethode
    }
    return this.prisma.trackingPixelMethod.create({
      data: {
        trackingPixelProviderID,
        trackingPixelProviderType
      }
    })
  }
}
