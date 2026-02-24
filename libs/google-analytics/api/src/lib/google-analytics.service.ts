import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { JWTInput } from 'google-auth-library';
import { format } from 'date-fns';
import { HotAndTrendingDataSource } from '@wepublish/article/api';
import { getMaxTake } from '@wepublish/utils/api';
import { GoogleAnalyticsDbConfig } from './google-analytics-db-config';

export const GA_CLIENT_OPTIONS = Symbol('GA_CLIENT_OPTIONS');

export type GoogleAnalyticsConfig = {
  credentials?: JWTInput;
  property?: string | null;
  articlePrefix: string;
};

@Injectable()
export class GoogleAnalyticsService implements HotAndTrendingDataSource {
  constructor(
    private prisma: PrismaClient,
    @Inject(GA_CLIENT_OPTIONS)
    private configProvider: GoogleAnalyticsDbConfig
  ) {}

  async getMostViewedArticles({
    start,
    take,
    skip,
  }: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]) {
    const config = await this.configProvider.getGoogleAnalytics();

    if (!config.credentials || !config.property) {
      console.warn(
        'GoogleAnalyticsService.getMostViewedArticles: No Google Analytics credentials set, returning empty array'
      );

      return [];
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: config.credentials,
    });

    const thirtyDaysAgo = new Date(
      new Date().getTime() - 60 * 60 * 24 * 31 * 1000
    );

    const [{ rows }] = await analyticsDataClient.runReport({
      property: `properties/${config.property}`,
      dateRanges: [
        {
          startDate: format(start ?? thirtyDaysAgo, 'yyyy-MM-dd'),
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'pagePath',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });

    const articleViewMap = (rows ?? []).reduce(
      (object, { dimensionValues, metricValues }) => {
        if (!dimensionValues?.at(0) || !metricValues?.at(0)) {
          return object;
        }

        const [{ value: slug }] = dimensionValues;
        const [{ value: views }] = metricValues;

        if (!slug?.startsWith(config.articlePrefix) || !views) {
          return object;
        }

        // Don't include sub pages of the article prefix
        if (
          slug?.split('/').length !== config.articlePrefix.split('/').length
        ) {
          return object;
        }

        object[slug.replace(config.articlePrefix, '')] = +views;

        return object;
      },
      {} as Record<string, number>
    );

    // Adding a number (even as string) to an object key ignores sorting
    // So we have to re-sort the array
    const sortedArticleViewMap = Object.entries(articleViewMap).sort(
      ([, a], [, b]) => {
        if (a > b) {
          return -1;
        }

        if (b > a) {
          return 1;
        }

        return 0;
      }
    );

    const slicedArticleViewMap = Object.fromEntries(
      sortedArticleViewMap.slice(
        skip ?? 0,
        (skip ?? 0) + getMaxTake(take ?? 10)
      )
    );

    const articles = await this.prisma.article.findMany({
      where: {
        slug: {
          in: Object.keys(slicedArticleViewMap),
          mode: 'insensitive',
        },
        publishedAt: {
          not: null,
        },
      },
    });

    return articles.sort((a, b) => {
      if (!a.slug || !articleViewMap[a.slug]) {
        return 1;
      }

      if (!b.slug || !articleViewMap[b.slug]) {
        return -1;
      }

      return (
        articleViewMap[a.slug] > articleViewMap[b.slug] ? -1
        : articleViewMap[b.slug] > articleViewMap[a.slug] ? 1
        : 0
      );
    });
  }
}
