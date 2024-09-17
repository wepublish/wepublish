import {Inject, Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {BetaAnalyticsDataClient} from '@google-analytics/data'
import {JWTInput} from 'google-auth-library'
import {format} from 'date-fns'
import {getMaxTake} from '@wepublish/utils/api'
import {HotAndTrendingDataSource} from '@wepublish/article/api'

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
      limit: getMaxTake(take ?? 10) + (skip ?? 0),
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

    const articleViewMap = (rows ?? [])
      .slice(skip ?? 0)
      .reduce((object, {dimensionValues, metricValues}) => {
        if (!dimensionValues?.at(0) || !metricValues?.at(0)) {
          return object
        }

        const [{value: slug}] = dimensionValues
        const [{value: views}] = metricValues

        if (!slug?.startsWith(this.config.articlePrefix) || !views) {
          return object
        }

        object[slug.replace(this.config.articlePrefix, '')] = +views

        return object
      }, {} as Record<string, number>)

    const articles = await this.prisma.article.findMany({
      where: {
        published: {
          slug: {
            in: Object.keys(articleViewMap),
            mode: 'insensitive'
          }
        }
      },
      include: {
        published: {
          select: {
            slug: true
          }
        }
      }
    })

    return articles.sort((a, b) => {
      if (!a.published?.slug || !articleViewMap[a.published.slug]) {
        return -1
      }

      if (!b.published?.slug || !articleViewMap[b.published.slug]) {
        return 1
      }

      return articleViewMap[a.published.slug] > articleViewMap[b.published.slug]
        ? -1
        : articleViewMap[b.published.slug] > articleViewMap[a.published.slug]
        ? 1
        : 0
    })
  }
}
