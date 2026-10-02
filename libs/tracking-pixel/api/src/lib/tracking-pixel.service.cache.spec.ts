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
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
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

  it('does not ask the database when no provider is configured', async () => {
    await service([]).addMissingArticleTrackingPixels('article-1');

    expect(prisma.articleTrackingPixels.findMany).not.toHaveBeenCalled();
  });
});
