import {TrackingPixelProvider} from '@wepublish/tracking-pixel/api'
import {Prisma, TrackingPixelMethod, PrismaClient, TrackingPixelProviderType} from '@prisma/client'

export class TrackingPixelContext {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelProviders: TrackingPixelProvider[]
  ) {}
  async getPixels(): Promise<Prisma.ArticleTrackingPixelsCreateManyArticleInput[]> {
    const trackingPixels: Prisma.ArticleTrackingPixelsCreateManyArticleInput[] = []
    for (const trackingPixelProvider of this.trackingPixelProviders) {
      const tackingPixelMethode = await this.findOrCreateMethode(
        trackingPixelProvider.id,
        trackingPixelProvider.type
      )
      try {
        trackingPixels.push({
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: (await trackingPixelProvider.createPixelUris({count: 1}))[0]
        })
      } catch (error) {
        trackingPixels.push({
          tackingPixelMethodID: tackingPixelMethode.id,
          uri: null,
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
