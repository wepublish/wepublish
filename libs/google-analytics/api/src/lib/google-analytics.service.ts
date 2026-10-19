import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { JWTInput } from 'google-auth-library';
import { format } from 'date-fns';
import { createHash } from 'crypto';
import {
  ArticleViewMap,
  CircuitBreaker,
  findMostViewedArticles,
  HotAndTrendingDataSource,
  toArticleViewMap,
} from '@wepublish/article/api';
import { GoogleAnalyticsDbConfig } from './google-analytics-db-config';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

export const GA_CLIENT_OPTIONS = Symbol('GA_CLIENT_OPTIONS');

export type GoogleAnalyticsConfig = {
  credentials?: JWTInput;
  property?: string | null;
  articlePrefix: string;
};

const GA_TIMEOUT_MS = 5_000;
const RESULT_CACHE_TTL_S = 5 * 60;

@Injectable()
export class GoogleAnalyticsService implements HotAndTrendingDataSource {
  private readonly logger = new Logger(GoogleAnalyticsService.name);
  private cachedClient: BetaAnalyticsDataClient | null = null;
  private cachedClientKey: string | null = null;

  private readonly circuitBreaker = new CircuitBreaker('GA4', this.logger);

  constructor(
    private prisma: PrismaClient,
    @Inject(GA_CLIENT_OPTIONS)
    private configProvider: GoogleAnalyticsDbConfig,
    private kv: KvTtlCacheService
  ) {}

  private getClient(credentials: JWTInput): BetaAnalyticsDataClient {
    const clientKey = `${credentials.client_email}:${createHash('sha256')
      .update(credentials.private_key ?? '')
      .digest('hex')}`;

    if (this.cachedClient && this.cachedClientKey === clientKey) {
      return this.cachedClient;
    }

    Promise.resolve(this.cachedClient?.close()).catch(() => undefined);
    this.cachedClient = new BetaAnalyticsDataClient({ credentials });
    this.cachedClientKey = clientKey;

    return this.cachedClient;
  }

  private async loadArticleViewMap(
    config: GoogleAnalyticsConfig & {
      credentials: JWTInput;
      property: string;
    },
    start?: Date | null
  ): Promise<ArticleViewMap> {
    if (this.circuitBreaker.isOpen()) {
      this.logger.warn('Circuit breaker is open, skipping GA4 call');
      throw new Error('Circuit breaker is open');
    }

    const analyticsDataClient = this.getClient(config.credentials);

    const thirtyDaysAgo = new Date(
      new Date().getTime() - 60 * 60 * 24 * 31 * 1000
    );

    let rows;
    try {
      const [result] = await analyticsDataClient.runReport(
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
      this.circuitBreaker.recordSuccess();
      rows = result.rows ?? [];
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(
        `GA4 runReport failed: ${error instanceof Error ? error.message : error}`
      );
      throw error;
    }

    return toArticleViewMap(
      rows.map(({ dimensionValues, metricValues }) => [
        dimensionValues?.at(0)?.value,
        +(metricValues?.at(0)?.value ?? 0),
      ]),
      config.articlePrefix
    );
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

    if (!config.credentials.client_email || !config.credentials.private_key) {
      this.logger.warn(
        'Google Analytics credentials lack client_email or private_key, returning empty array'
      );

      return [];
    }

    const articleViewMap = await this.kv.getOrLoadNs<ArticleViewMap>(
      'ga4',
      `article-view-map:${config.property}:${start ? format(start, 'yyyy-MM-dd') : ''}:${config.articlePrefix}`,
      () =>
        this.loadArticleViewMap(
          config as GoogleAnalyticsConfig & {
            credentials: JWTInput;
            property: string;
          },
          start
        ),
      RESULT_CACHE_TTL_S
    );

    return findMostViewedArticles(this.prisma, articleViewMap, { take, skip });
  }
}
