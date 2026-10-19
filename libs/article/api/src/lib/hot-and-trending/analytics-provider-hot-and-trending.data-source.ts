import { AnalyticsProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { HotAndTrendingDataSource } from './hot-and-trending.resolver';

const TTL_S = 21600; // 6h

/**
 * Hands Hot & Trending to the analytics provider that is chosen for it in the
 * analytics integration settings.
 */
export class AnalyticsProviderHotAndTrendingDataSource
  implements HotAndTrendingDataSource
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly sources: Partial<
      Record<AnalyticsProviderType, HotAndTrendingDataSource>
    >
  ) {}

  private async loadProviderType(): Promise<AnalyticsProviderType | null> {
    const provider = await this.prisma.settingAnalyticsProvider.findFirst({
      where: { hotAndTrending: true },
      select: { type: true },
      orderBy: { modifiedAt: 'desc' },
    });

    return provider?.type ?? null;
  }

  async getMostViewedArticles(
    opts: Parameters<HotAndTrendingDataSource['getMostViewedArticles']>[0]
  ) {
    const type = await this.kv.getOrLoadNs<AnalyticsProviderType | null>(
      'settings:analyticsprovider',
      'hot-and-trending',
      () => this.loadProviderType(),
      TTL_S
    );
    const source = type ? this.sources[type] : undefined;

    if (!source) {
      return [];
    }

    return source.getMostViewedArticles(opts);
  }
}
