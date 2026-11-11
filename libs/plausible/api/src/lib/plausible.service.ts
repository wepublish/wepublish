import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResiliencePolicy, ResilienceService } from '@nestjs/resilience';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import {
  ArticleViewMap,
  findMostViewedArticles,
  HOT_AND_TRENDING_CIRCUIT_BREAKER,
  HotAndTrendingDataSource,
  toArticleViewMap,
} from '@wepublish/article/api';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { PLAUSIBLE_CACHE_NAMESPACE } from './plausible-cache';
import { PlausibleDbConfig } from './plausible-db-config';

export const PLAUSIBLE_CLIENT_OPTIONS = Symbol('PLAUSIBLE_CLIENT_OPTIONS');

export type PlausibleConfig = {
  apiKey?: string;
  siteId?: string | null;
  url: string;
  articlePrefix: string;
};

type PlausibleQueryResponse = {
  results: Array<{ dimensions: string[]; metrics: number[] }>;
};

const PLAUSIBLE_TIMEOUT_MS = 5_000;
const RESULT_CACHE_TTL_S = 5 * 60;

@Injectable()
export class PlausibleService implements HotAndTrendingDataSource {
  private readonly logger = new Logger(PlausibleService.name);
  private readonly policy: ResiliencePolicy;

  constructor(
    private prisma: PrismaClient,
    @Inject(PLAUSIBLE_CLIENT_OPTIONS)
    private configProvider: PlausibleDbConfig,
    private kv: NamespacedCache,
    resilience: ResilienceService
  ) {
    this.policy = resilience.create(
      {
        timeout: PLAUSIBLE_TIMEOUT_MS,
        circuitBreaker: {
          ...HOT_AND_TRENDING_CIRCUIT_BREAKER,
          name: 'plausible',
        },
      },
      'plausible'
    );
  }

  private async loadArticleViewMap(
    config: PlausibleConfig & { apiKey: string; siteId: string },
    start?: Date | null
  ): Promise<ArticleViewMap> {
    const thirtyDaysAgo = new Date(
      new Date().getTime() - 60 * 60 * 24 * 31 * 1000
    );

    let results: PlausibleQueryResponse['results'];
    try {
      results = await this.policy.execute(async ({ signal }) => {
        const response = await fetch(
          `${config.url.replace(/\/+$/, '')}/api/v2/query`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              site_id: config.siteId,
              metrics: ['visitors'],
              date_range: [
                format(start ?? thirtyDaysAgo, 'yyyy-MM-dd'),
                format(new Date(), 'yyyy-MM-dd'),
              ],
              dimensions: ['event:page'],
              ...(config.articlePrefix && {
                filters: [['contains', 'event:page', [config.articlePrefix]]],
              }),
              order_by: [['visitors', 'desc']],
            }),
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Plausible responded with ${response.status}: ${await response.text()}`
          );
        }

        return ((await response.json()) as PlausibleQueryResponse).results;
      });
    } catch (error) {
      this.logger.error(
        `Plausible query failed: ${error instanceof Error ? error.message : error}`
      );
      throw error;
    }

    return toArticleViewMap(
      (results ?? []).map(({ dimensions, metrics }) => [
        dimensions?.at(0),
        metrics?.at(0) ?? 0,
      ]),
      config.articlePrefix
    );
  }

  async getMostViewedArticles({
    start,
    take,
    skip,
  }: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]) {
    const config = await this.configProvider.getPlausible();

    if (!config.apiKey || !config.siteId) {
      this.logger.warn(
        'No Plausible api key or site set, returning empty array'
      );

      return [];
    }

    const articleViewMap = await this.kv.getOrLoadNs<ArticleViewMap>(
      PLAUSIBLE_CACHE_NAMESPACE,
      `article-view-map:${config.url}:${config.siteId}:${start ? format(start, 'yyyy-MM-dd') : ''}:${config.articlePrefix}`,
      () =>
        this.loadArticleViewMap(
          config as PlausibleConfig & { apiKey: string; siteId: string },
          start
        ),
      RESULT_CACHE_TTL_S
    );

    return findMostViewedArticles(this.prisma, articleViewMap, { take, skip });
  }
}
