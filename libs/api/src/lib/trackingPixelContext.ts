import {TrackingPixelProvider} from '@wepublish/tracking-pixel/api'
import {
  Prisma,
  TrackingPixelMethod,
  PrismaClient,
  TrackingPixelProviderType,
  ArticleTrackingPixels
} from '@prisma/client'

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

  async addMissingArticleTrackingPixels(
    prisma: PrismaClient,
    articleId: string,
    trackingPixels: (ArticleTrackingPixels & {trackingPixelMethod: TrackingPixelMethod})[]
  ) {
    for (const trackingPixelProvider of this.trackingPixelProviders) {
      const matchingPixel = trackingPixels.find(
        tp => tp.trackingPixelMethod.trackingPixelProviderID === trackingPixelProvider.id
      )
      if (matchingPixel && !matchingPixel.error) {
        continue
      }
      const tackingPixelMethode = await this.findOrCreateMethode(
        trackingPixelProvider.id,
        trackingPixelProvider.type
      )

      if (matchingPixel) {
        await prisma.articleTrackingPixels.delete({
          where: {
            id: matchingPixel.id
          }
        })
      }

      try {
        const trackingPixel = await trackingPixelProvider.createPixelUri({
          internalTrackingId: `A${articleId}`
        })
        await prisma.articleTrackingPixels.create({
          data: {
            articleId,
            tackingPixelMethodID: tackingPixelMethode.id,
            uri: trackingPixel.uri,
            pixelUid: trackingPixel.pixelUid
          }
        })
      } catch (error) {
        await prisma.articleTrackingPixels.create({
          data: {
            articleId,
            tackingPixelMethodID: tackingPixelMethode.id,
            uri: null,
            pixelUid: null,
            error: JSON.stringify(error.message)
          }
        })
      }
    }
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
