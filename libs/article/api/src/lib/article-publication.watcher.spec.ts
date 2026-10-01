import { ArticlePublicationWatcher } from './article-publication.watcher';

describe('ArticlePublicationWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: {
    article: { findMany: jest.Mock };
    articleRevision: { findMany: jest.Mock };
  };
  let publicContentCache: { invalidate: jest.Mock };
  let watcher: ArticlePublicationWatcher;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    prisma = {
      article: { findMany: jest.fn().mockResolvedValue([]) },
      articleRevision: { findMany: jest.fn().mockResolvedValue([]) },
    };
    publicContentCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    watcher = new ArticlePublicationWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    jest.useRealTimers();
  });

  it('clears cached articles and answers when a scheduled article goes live', async () => {
    prisma.article.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:30.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await jest.advanceTimersByTimeAsync(20_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('also clears them when a scheduled revision of a published article goes live', async () => {
    prisma.articleRevision.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:10.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await jest.advanceTimersByTimeAsync(15_000);

    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('only asks for publications in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    const where = {
      publishedAt: { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') },
    };
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where })
    );
    expect(prisma.articleRevision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where })
    );
  });

  it('keeps running when the database is unavailable', async () => {
    prisma.article.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
