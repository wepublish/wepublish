import {TrackingPixelProvider} from '@wepublish/tracking-pixel/api'
import {Prisma} from '@prisma/client'

export class TrackingPixelContext {
  constructor(private trackingPixelProviders: TrackingPixelProvider[]) {}
  async getPixels(): Promise<Prisma.ArticleTrackingPixelsCreateManyArticleInput[]> {
    const trackingPixels: Prisma.ArticleTrackingPixelsCreateManyArticleInput[] = []
    for (const trackingPixelProvider of this.trackingPixelProviders) {
      trackingPixels.push({
        trackingPixelProviderID: trackingPixelProvider.id,
        uri: (await trackingPixelProvider.createPixelUris({count: 1}))[0]
      })
    }
    return trackingPixels
  }
}
