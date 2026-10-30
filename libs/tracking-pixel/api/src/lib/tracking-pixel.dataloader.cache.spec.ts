import { type NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import {
  type NamespacedCacheTesting,
  createNamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { DistributedClaims } from '@wepublish/dragonfly/api';
import { TrackingPixelDataloader } from './tracking-pixel.dataloader';
import { TrackingPixelService } from './tracking-pixel.service';

describe('tracking pixel row cache', () => {
  let testing: NamespacedCacheTesting;
  let kv: NamespacedCache;
  let prisma: {
    articleTrackingPixels: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    trackingPixelMethod: { upsert: ReturnType<typeof vi.fn> };
    article: { findUnique: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting({
      sharedNamespaces: ['tracking-pixels'],
    });
    kv = testing.cache;
    prisma = {
      articleTrackingPixels: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      trackingPixelMethod: {
        upsert: vi.fn().mockResolvedValue({ id: 'method-1' }),
      },
      article: { findUnique: vi.fn().mockResolvedValue({ slug: 'a1' }) },
    };
  });

  afterEach(() => testing.close());

  const rowQueries = () =>
    prisma.articleTrackingPixels.findMany.mock.calls.filter(
      ([args]) => typeof args.where.articleId === 'object'
    ).length;

  it('loads the pixels of an article once across requests', async () => {
    prisma.articleTrackingPixels.findMany.mockResolvedValue([
      { articleId: 'a1', uri: 'https://px', trackingPixelMethod: {} },
    ]);

    await new TrackingPixelDataloader(prisma as any, kv).load('a1');
    const pixels = await new TrackingPixelDataloader(prisma as any, kv).load(
      'a1'
    );

    expect(pixels).toHaveLength(1);
    expect(rowQueries()).toBe(1);
  });

  it('loads them again once pixels were added to the article', async () => {
    await new TrackingPixelDataloader(prisma as any, kv).load('a1');
    await new TrackingPixelService(
      prisma as any,
      {
        trackingPixelProviders: [
          {
            id: 'prolitteris-1',
            createPixelUri: vi
              .fn()
              .mockResolvedValue({ uri: 'https://px', pixelUid: 'p' }),
            getTrackingPixelType: vi.fn().mockResolvedValue('prolitteris'),
          },
        ],
      } as any,
      kv,
      testing.module.get(DistributedClaims),
      { invalidateArticleAnswers: vi.fn() } as any
    ).addMissingArticleTrackingPixels('a1');
    await new TrackingPixelDataloader(prisma as any, kv).load('a1');

    expect(rowQueries()).toBe(2);
  });
});
