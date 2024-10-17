import {Inject, Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {BetaAnalyticsDataClient} from '@google-analytics/data'
import {JWTInput} from 'google-auth-library'
import {format} from 'date-fns'
import {HotAndTrendingDataSource} from '@wepublish/article/api'
import {getMaxTake, PrimeDataLoader} from '@wepublish/utils/api'
import {ArticleDataloaderService} from '@wepublish/article/api'

export const GA_CLIENT_OPTIONS = Symbol('GA_CLIENT_OPTIONS')
export type GoogleAnalyticsConfig = {
  credentials?: JWTInput
  property?: string
  articlePrefix: string
}

@Injectable()
export class GoogleAnalyticsService implements HotAndTrendingDataSource {
  private analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: this.config.credentials
  })

  constructor(
    private prisma: PrismaClient,
    @Inject(GA_CLIENT_OPTIONS)
    private config: GoogleAnalyticsConfig
  ) {}

  @PrimeDataLoader(ArticleDataloaderService)
  async getMostViewedArticles({
    start,
    take,
    skip
  }: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]) {
    if (!this.config.credentials || !this.config.property) {
      console.warn(
        'GoogleAnalyticsService.getMostViewedArticles: No Google Analytics credentials set, returning empty array'
      )

      return []
    }

    const thirtyDaysAgo = new Date(new Date().getTime() - 60 * 60 * 24 * 31 * 1000)

    const [{rows}] = await this.analyticsDataClient.runReport({
      property: `properties/${this.config.property}`,
      dateRanges: [
        {
          startDate: format(start ?? thirtyDaysAgo, 'yyyy-MM-dd'),
          endDate: 'today'
        }
      ],
      dimensions: [
        {
          name: 'pagePath'
        }
      ],
      metrics: [
        {
          name: 'activeUsers'
        }
      ]
    })

    const articleViewMap = (rows ?? []).reduce((object, {dimensionValues, metricValues}) => {
      if (!dimensionValues?.at(0) || !metricValues?.at(0)) {
        return object
      }

      const [{value: slug}] = dimensionValues
      const [{value: views}] = metricValues

      if (!slug?.startsWith(this.config.articlePrefix) || !views) {
        return object
      }

      // Don't include sub pages of the article prefix
      if (slug?.split('/').length !== this.config.articlePrefix.split('/').length) {
        return object
      }

      object[slug.replace(this.config.articlePrefix, '')] = +views

      return object
    }, {} as Record<string, number>)

    const slicedArticleViewMap = Object.fromEntries(
      Object.entries(articleViewMap).slice(skip ?? 0, (skip ?? 0) + getMaxTake(take ?? 10))
    )

    const articles = await this.prisma.article.findMany({
      where: {
        slug: {
          in: Object.keys(slicedArticleViewMap),
          mode: 'insensitive'
        },
        revisions: {
          some: {
            publishedAt: {
              not: null
            }
          }
        }
      },
      include: {
        revisions: {
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1
        }
      }
    })

    return articles.sort((a, b) => {
      if (!a?.slug || !articleViewMap[a.slug]) {
        return -1
      }

      if (!b?.slug || !articleViewMap[b.slug]) {
        return 1
      }

      return articleViewMap[a.slug] > articleViewMap[b.slug]
        ? -1
        : articleViewMap[b.slug] > articleViewMap[a.slug]
        ? 1
        : 0
    })
  }
}
