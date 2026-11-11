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
import { UMAMI_CACHE_NAMESPACE } from './umami-cache';
import { UmamiDbConfig } from './umami-db-config';

export const UMAMI_CLIENT_OPTIONS = Symbol('UMAMI_CLIENT_OPTIONS');

export type UmamiConfig = {
  apiKey?: string;
  websiteId?: string | null;
  /**
   * Base url of the API, `https://api.umami.is/v1` for Umami Cloud
   * or `https://<host>/api` for a self hosted instance.
   */
  url: string;
  articlePrefix: string;
};

type UmamiMetricsResponse = Array<{ x: string | null; y: number }>;

const UMAMI_TIMEOUT_MS = 5_000;
const RESULT_CACHE_TTL_S = 5 * 60;

@Injectable()
export class UmamiService implements HotAndTrendingDataSource {
  private readonly logger = new Logger(UmamiService.name);
  private readonly policy: ResiliencePolicy;

  constructor(
    private prisma: PrismaClient,
    @Inject(UMAMI_CLIENT_OPTIONS)
    private configProvider: UmamiDbConfig,
    private kv: NamespacedCache,
    resilience: ResilienceService
  ) {
    this.policy = resilience.create(
      {
        timeout: UMAMI_TIMEOUT_MS,
        circuitBreaker: { ...HOT_AND_TRENDING_CIRCUIT_BREAKER, name: 'umami' },
      },
      'umami'
    );
  }

  private async loadArticleViewMap(
    config: UmamiConfig & { apiKey: string; websiteId: string },
    start?: Date | null
  ): Promise<ArticleViewMap> {
    const thirtyDaysAgo = new Date(
      new Date().getTime() - 60 * 60 * 24 * 31 * 1000
    );
    const params = new URLSearchParams({
      type: 'path',
      startAt: `${(start ?? thirtyDaysAgo).getTime()}`,
      endAt: `${new Date().getTime()}`,
    });

    let metrics: UmamiMetricsResponse;
    try {
      metrics = await this.policy.execute(async ({ signal }) => {
        const response = await fetch(
          `${config.url.replace(/\/+$/, '')}/websites/${encodeURIComponent(config.websiteId)}/metrics?${params}`,
          {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              Accept: 'application/json',
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Umami responded with ${response.status}: ${await response.text()}`
          );
        }

        return (await response.json()) as UmamiMetricsResponse;
      });
    } catch (error) {
      this.logger.error(
        `Umami metrics failed: ${error instanceof Error ? error.message : error}`
      );
      throw error;
    }

    return toArticleViewMap(
      (metrics ?? []).map(({ x, y }) => [x, y]),
      config.articlePrefix
    );
  }

  async getMostViewedArticles({
    start,
    take,
    skip,
  }: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]) {
    const config = await this.configProvider.getUmami();

    if (!config.apiKey || !config.websiteId) {
      this.logger.warn(
        'No Umami api key or website set, returning empty array'
      );

      return [];
    }

    const articleViewMap = await this.kv.getOrLoadNs<ArticleViewMap>(
      UMAMI_CACHE_NAMESPACE,
      `article-view-map:${config.url}:${config.websiteId}:${start ? format(start, 'yyyy-MM-dd') : ''}:${config.articlePrefix}`,
      () =>
        this.loadArticleViewMap(
          config as UmamiConfig & { apiKey: string; websiteId: string },
          start
        ),
      RESULT_CACHE_TTL_S
    );

    return findMostViewedArticles(this.prisma, articleViewMap, { take, skip });
  }
}
