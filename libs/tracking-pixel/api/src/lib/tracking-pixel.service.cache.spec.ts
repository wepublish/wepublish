import { Logger } from '@nestjs/common';
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
      deleteMany: ReturnType<typeof vi.fn>;
    };
    trackingPixelMethod: { upsert: ReturnType<typeof vi.fn> };
    article: { findUnique: ReturnType<typeof vi.fn> };
  };
  let publicContentCache: {
    invalidateArticleAnswers: ReturnType<typeof vi.fn>;
  };

  const service = (providers = [provider('prolitteris-1')]) =>
    new TrackingPixelService(
      prisma as any,
      { trackingPixelProviders: providers } as any,
      kv,
      publicContentCache as any
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
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      trackingPixelMethod: {
        upsert: vi.fn().mockResolvedValue({ id: 'method-1' }),
      },
      article: {
        findUnique: vi.fn().mockResolvedValue({ slug: 'my-article' }),
      },
    };
    publicContentCache = {
      invalidateArticleAnswers: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it('does not fail the article when another request replaced the failed pixel first', async () => {
    prisma.articleTrackingPixels.findMany.mockResolvedValue([
      {
        id: 'pixel-1',
        error: '"ProLitteris down"',
        trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
      },
    ]);
    prisma.articleTrackingPixels.delete.mockRejectedValue(
      new Error('No record was found for a delete.')
    );
    prisma.articleTrackingPixels.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service().addMissingArticleTrackingPixels('article-1')
    ).resolves.toBeUndefined();
    expect(prisma.articleTrackingPixels.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        articleId: 'article-1',
        uri: 'https://prolitteris-1/px',
      }),
    });
  });

  it('requests one pixel when many readers open an article without one at the same time', async () => {
    let answer!: () => void;
    const slow = provider('prolitteris-1');
    slow.createPixelUri.mockReturnValue(
      new Promise(resolve => {
        answer = () =>
          resolve({ uri: 'https://prolitteris-1/px', pixelUid: 'p' });
      })
    );
    prisma.articleTrackingPixels.findMany.mockResolvedValue([]);
    const pixels = service([slow]);

    const reads = Array.from({ length: 5 }, () =>
      pixels.addMissingArticleTrackingPixels('article-1')
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    answer();
    await Promise.all(reads);

    expect(slow.createPixelUri).toHaveBeenCalledTimes(1);
    expect(prisma.articleTrackingPixels.create).toHaveBeenCalledTimes(1);
  });

  it('leaves a missing pixel to the replica that is already requesting it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    const claim = vi.spyOn(kv, 'claim').mockResolvedValue(false);
    const pixels = provider('prolitteris-1');
    prisma.articleTrackingPixels.findMany.mockResolvedValue([]);

    const adding = service([pixels]).addMissingArticleTrackingPixels(
      'article-1'
    );
    await vi.advanceTimersByTimeAsync(5_000);
    await adding;

    expect(claim).toHaveBeenCalledWith(
      expect.stringContaining('article-1'),
      expect.any(Number)
    );
    expect(pixels.createPixelUri).not.toHaveBeenCalled();
    expect(prisma.articleTrackingPixels.create).not.toHaveBeenCalled();
  });

  it('answers once the replica holding the claim has added the pixels, so a cached answer includes them', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    vi.spyOn(kv, 'claim').mockResolvedValue(false);
    prisma.articleTrackingPixels.findMany.mockResolvedValue([]);
    let answered = false;

    const adding = service([provider('prolitteris-1')])
      .addMissingArticleTrackingPixels('article-1')
      .then(() => {
        answered = true;
      });
    await vi.advanceTimersByTimeAsync(500);
    const beforeOtherReplica = answered;
    await kv.setNs('tracking-pixels', 'prolitteris-1:article-1', true, 60);
    await vi.advanceTimersByTimeAsync(300);
    await adding;

    expect(beforeOtherReplica).toBe(false);
    expect(answered).toBe(true);
  });

  it('keeps a working pixel and drops failed attempts stored next to it', async () => {
    const pixels = provider('prolitteris-1');
    prisma.articleTrackingPixels.findMany.mockResolvedValue([
      {
        id: 'failed-1',
        error: '"ProLitteris down"',
        trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
      },
      {
        id: 'working-1',
        error: null,
        trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
      },
    ]);

    await service([pixels]).addMissingArticleTrackingPixels('article-1');

    expect(pixels.createPixelUri).not.toHaveBeenCalled();
    expect(prisma.articleTrackingPixels.create).not.toHaveBeenCalled();
    expect(prisma.articleTrackingPixels.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['failed-1'] } },
    });
  });

  it('replaces every failed attempt with one pixel when retrying', async () => {
    const pixels = provider('prolitteris-1');
    prisma.articleTrackingPixels.findMany.mockResolvedValue(
      ['failed-1', 'failed-2'].map(id => ({
        id,
        error: '"ProLitteris down"',
        trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
      }))
    );

    await service([pixels]).addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['failed-1', 'failed-2'] } },
    });
    expect(pixels.createPixelUri).toHaveBeenCalledTimes(1);
    expect(prisma.articleTrackingPixels.create).toHaveBeenCalledTimes(1);
  });

  describe('when adding the pixels fails outside the pixel request', () => {
    const failures: Array<[string, () => void]> = [
      [
        'the provider type cannot be read',
        () => {
          broken.getTrackingPixelType.mockRejectedValue(
            new Error('ProLitteris credentials could not be decrypted')
          );
        },
      ],
      [
        'another request created the pixel method first',
        () => {
          prisma.trackingPixelMethod.upsert.mockRejectedValue(
            new Error('Unique constraint failed (P2002)')
          );
        },
      ],
      [
        'the database is unreachable',
        () => {
          prisma.articleTrackingPixels.findMany.mockRejectedValue(
            new Error("Can't reach database server")
          );
        },
      ],
    ];
    let broken: ReturnType<typeof provider>;

    beforeEach(() => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      broken = provider('prolitteris-1');
      prisma.articleTrackingPixels.findMany.mockResolvedValue([]);
    });

    it.each(failures)(
      'does not fail the article when %s',
      async (_reason, fail) => {
        fail();

        await expect(
          service([broken]).addMissingArticleTrackingPixels('article-1')
        ).resolves.toBeUndefined();
      }
    );

    it.each(failures)(
      'does not keep the next request waiting for the replica that failed when %s',
      async (_reason, fail) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
        vi.spyOn(kv, 'claim')
          .mockResolvedValueOnce(true)
          .mockResolvedValue(false);
        fail();

        await service([broken])
          .addMissingArticleTrackingPixels('article-1')
          .catch(() => undefined);

        let answered = false;
        const next = service([broken])
          .addMissingArticleTrackingPixels('article-1')
          .then(() => {
            answered = true;
          });
        await vi.advanceTimersByTimeAsync(100);
        const answeredAtOnce = answered;
        await vi.advanceTimersByTimeAsync(5_000);
        await next;

        expect(answeredAtOnce).toBe(true);
      }
    );

    it('tries again 15 minutes later', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      broken.getTrackingPixelType.mockRejectedValue(
        new Error('ProLitteris credentials could not be decrypted')
      );

      await service([broken]).addMissingArticleTrackingPixels('article-1');
      vi.advanceTimersByTime(14 * 60_000);
      await service([broken]).addMissingArticleTrackingPixels('article-1');

      expect(prisma.articleTrackingPixels.findMany).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2 * 60_000);
      await service([broken]).addMissingArticleTrackingPixels('article-1');

      expect(prisma.articleTrackingPixels.findMany).toHaveBeenCalledTimes(2);
    });

    it('reports the failure', async () => {
      const failed = vi.mocked(Logger.prototype.error);
      broken.getTrackingPixelType.mockRejectedValue(
        new Error('ProLitteris credentials could not be decrypted')
      );

      await service([broken]).addMissingArticleTrackingPixels('article-1');

      expect(failed).toHaveBeenCalledWith(
        expect.stringContaining('article-1'),
        expect.any(Error)
      );
    });
  });

  describe('cached answers of the article', () => {
    it('are rebuilt once a pixel was added, so readers get the pixel', async () => {
      prisma.articleTrackingPixels.findMany.mockResolvedValue([]);

      await service().addMissingArticleTrackingPixels('article-1');

      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        select: { slug: true },
      });
      expect(publicContentCache.invalidateArticleAnswers).toHaveBeenCalledWith({
        id: 'article-1',
        slug: 'my-article',
      });
    });

    it('are rebuilt once a failed pixel was replaced by a working one', async () => {
      prisma.articleTrackingPixels.findMany.mockResolvedValue([
        {
          id: 'failed-1',
          error: '"ProLitteris down"',
          trackingPixelMethod: { trackingPixelProviderID: 'prolitteris-1' },
        },
      ]);

      await service().addMissingArticleTrackingPixels('article-1');

      expect(publicContentCache.invalidateArticleAnswers).toHaveBeenCalledTimes(
        1
      );
    });

    it('are kept when the article already had its pixel', async () => {
      await service().addMissingArticleTrackingPixels('article-1');

      expect(
        publicContentCache.invalidateArticleAnswers
      ).not.toHaveBeenCalled();
    });

    it('are kept while the pixel request keeps failing, so an outage does not empty the cache', async () => {
      const failing = provider('prolitteris-1');
      failing.createPixelUri.mockRejectedValue(new Error('ProLitteris down'));
      prisma.articleTrackingPixels.findMany.mockResolvedValue([]);

      await service([failing]).addMissingArticleTrackingPixels('article-1');

      expect(
        publicContentCache.invalidateArticleAnswers
      ).not.toHaveBeenCalled();
    });
  });

  it('does not ask the database when no provider is configured', async () => {
    await service([]).addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.findMany).not.toHaveBeenCalled();
  });
});
