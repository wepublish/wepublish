import { AnalyticsProviderType, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { AnalyticsProviderHotAndTrendingDataSource } from './analytics-provider-hot-and-trending.data-source';
import { HotAndTrendingDataSource } from './hot-and-trending.resolver';

describe('AnalyticsProviderHotAndTrendingDataSource', () => {
  let testing: NamespacedCacheTesting | undefined;

  afterEach(async () => {
    await testing?.close();
    testing = undefined;
  });

  const source = (slug: string): HotAndTrendingDataSource => ({
    getMostViewedArticles: vi.fn().mockResolvedValue([{ slug }]),
  });

  const create = async (type: AnalyticsProviderType | null) => {
    testing = await createNamespacedCacheTesting();
    const findFirst = vi.fn().mockResolvedValue(type ? { type } : null);
    const sources = {
      [AnalyticsProviderType.GOOGLE]: source('google'),
      [AnalyticsProviderType.PLAUSIBLE]: source('plausible'),
      [AnalyticsProviderType.UMAMI]: source('umami'),
    };

    return {
      findFirst,
      sources,
      dataSource: new AnalyticsProviderHotAndTrendingDataSource(
        { settingAnalyticsProvider: { findFirst } } as unknown as PrismaClient,
        testing.cache,
        sources
      ),
    };
  };

  it.each([
    AnalyticsProviderType.GOOGLE,
    AnalyticsProviderType.PLAUSIBLE,
    AnalyticsProviderType.UMAMI,
  ])('asks the provider chosen for Hot & Trending (%s)', async type => {
    const { dataSource, sources, findFirst } = await create(type);
    const opts = { take: 5, start: new Date('2023-01-01') };

    await expect(dataSource.getMostViewedArticles(opts)).resolves.toEqual([
      { slug: type.toLowerCase() },
    ]);
    expect(sources[type].getMostViewedArticles).toHaveBeenCalledWith(opts);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hotAndTrending: true } })
    );
  });

  it('returns nothing when no provider is chosen', async () => {
    const { dataSource, sources } = await create(null);

    await expect(dataSource.getMostViewedArticles({})).resolves.toEqual([]);
    Object.values(sources).forEach(({ getMostViewedArticles }) =>
      expect(getMostViewedArticles).not.toHaveBeenCalled()
    );
  });

  it('caches the chosen provider', async () => {
    const { dataSource, findFirst } = await create(AnalyticsProviderType.UMAMI);

    await dataSource.getMostViewedArticles({});
    await dataSource.getMostViewedArticles({});

    expect(findFirst).toHaveBeenCalledTimes(1);
  });
});
