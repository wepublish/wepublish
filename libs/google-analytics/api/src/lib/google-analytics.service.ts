import { Inject, Injectable, Logger } from '@nestjs/common';
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

const GA_TIMEOUT_MS = 5_000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000;

@Injectable()
export class GoogleAnalyticsService implements HotAndTrendingDataSource {
  private readonly logger = new Logger(GoogleAnalyticsService.name);
  private cachedClient: BetaAnalyticsDataClient | null = null;
  private cachedClientEmail: string | null = null;

  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(
    private prisma: PrismaClient,
    @Inject(GA_CLIENT_OPTIONS)
    private configProvider: GoogleAnalyticsDbConfig
  ) {}

  private isCircuitOpen(): boolean {
    if (this.consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) {
      return false;
    }

    if (Date.now() >= this.circuitOpenUntil) {
      this.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  private recordFailure(): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
      this.logger.warn(
        `Circuit breaker open after ${this.consecutiveFailures} consecutive GA4 failures. ` +
          `Skipping GA4 calls for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`
      );
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  private getClient(credentials: JWTInput): BetaAnalyticsDataClient {
    if (
      this.cachedClient &&
      this.cachedClientEmail === credentials.client_email
    ) {
      return this.cachedClient;
    }

    this.cachedClient?.close();
    this.cachedClient = new BetaAnalyticsDataClient({ credentials });
    this.cachedClientEmail = credentials.client_email ?? null;

    return this.cachedClient;
  }

  async getMostViewedArticles({
    start,
    take,
    skip,
  }: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]) {
    const config = await this.configProvider.getGoogleAnalytics();

    if (!config.credentials || !config.property) {
      this.logger.warn(
        'No Google Analytics credentials set, returning empty array'
      );

      return [];
    }

    if (this.isCircuitOpen()) {
      this.logger.warn('Circuit breaker is open, skipping GA4 call');

      return [];
    }

    const analyticsDataClient = this.getClient(config.credentials);

    const thirtyDaysAgo = new Date(
      new Date().getTime() - 60 * 60 * 24 * 31 * 1000
    );

    let rows;
    try {
      [{ rows }] = await analyticsDataClient.runReport(
        {
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
        },
        {
          timeout: GA_TIMEOUT_MS,
        }
      );
      this.recordSuccess();
    } catch (error) {
      this.recordFailure();
      this.logger.error(
        `GA4 runReport failed: ${error instanceof Error ? error.message : error}`
      );

      return [];
    }

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
