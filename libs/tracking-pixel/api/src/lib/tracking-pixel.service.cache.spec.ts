import { createCache } from 'cache-manager';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { TrackingPixelService } from './tracking-pixel.service';

const provider = (id: string, createPixelUri = vi.fn()) => ({
  id,
  createPixelUri: createPixelUri.mockResolvedValue({
    uri: `https://${id}/px`,
    pixelUid: id,
  }),
  getTrackingPixelType: vi.fn().mockResolvedValue('prolitteris'),
  initDatabaseConfiguration: vi.fn(),
});

describe('TrackingPixelService cache', () => {
  let kv: KvTtlCacheService;
  let prisma: {
    articleTrackingPixels: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    trackingPixelMethod: { upsert: ReturnType<typeof vi.fn> };
  };

  const service = (providers = [provider('prolitteris-1')]) =>
    new TrackingPixelService(
      prisma as any,
      { trackingPixelProviders: providers } as any,
      kv
    );

  beforeEach(() => {
    kv = new KvTtlCacheService(createCache());
    prisma = {
      articleTrackingPixels: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'pixel-1',
            error: null,
            trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
          },
        ]),
        create: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      trackingPixelMethod: {
        upsert: vi.fn().mockResolvedValue({ id: 'method-1' }),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks the pixels of an article only once', async () => {
    await service().addMissingArticleTrackingPixels('article-1');
    await service().addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.findMany).toHaveBeenCalledTimes(1);
  });

  it('checks every article on its own', async () => {
    await service().addMissingArticleTrackingPixels('article-1');
    await service().addMissingArticleTrackingPixels('article-2');

    expect(prisma.articleTrackingPixels.findMany).toHaveBeenCalledTimes(2);
  });

  it('checks again once another provider was configured', async () => {
    await service().addMissingArticleTrackingPixels('article-1');
    await service([
      provider('prolitteris-1'),
      provider('prolitteris-2'),
    ]).addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.findMany).toHaveBeenCalledTimes(2);
  });

  it('retries a failed pixel at most every 15 minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const failing = provider('prolitteris-1');
    failing.createPixelUri.mockRejectedValue(new Error('ProLitteris down'));
    prisma.articleTrackingPixels.findMany.mockResolvedValue([]);

    await service([failing]).addMissingArticleTrackingPixels('article-1');
    vi.advanceTimersByTime(14 * 60_000);
    await service([failing]).addMissingArticleTrackingPixels('article-1');

    expect(failing.createPixelUri).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * 60_000);
    await service([failing]).addMissingArticleTrackingPixels('article-1');

    expect(failing.createPixelUri).toHaveBeenCalledTimes(2);
  });

  it('does not ask the database when no provider is configured', async () => {
    await service([]).addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.findMany).not.toHaveBeenCalled();
  });
});
