import type { Mock } from 'vitest';
import { ArticlePublicationWatcher } from './article-publication.watcher';

describe('ArticlePublicationWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: {
    article: { findMany: Mock };
    articleRevision: { findMany: Mock };
  };
  let publicContentCache: {
    invalidate: Mock;
    invalidateArticlePages: Mock;
  };
  let watcher: ArticlePublicationWatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = {
      article: { findMany: vi.fn().mockResolvedValue([]) },
      articleRevision: { findMany: vi.fn().mockResolvedValue([]) },
    };
    publicContentCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
      invalidateArticlePages: vi.fn().mockResolvedValue(undefined),
    };
    watcher = new ArticlePublicationWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    vi.useRealTimers();
  });

  it('clears cached articles and answers when a scheduled article goes live', async () => {
    prisma.article.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:30.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('also clears them when a scheduled revision of a published article goes live', async () => {
    prisma.articleRevision.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:10.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('tells the websites which article pages changed once a scheduled revision goes live', async () => {
    const publishedAt = new Date('2026-10-01T10:00:10.000Z');
    prisma.articleRevision.findMany.mockResolvedValue([
      { publishedAt, article: { id: '1', slug: 'one' } },
    ]);
    prisma.article.findMany.mockImplementation(({ where }) =>
      Promise.resolve(
        where.publishedAt === publishedAt ?
          [{ publishedAt, id: '2', slug: 'two' }]
        : []
      )
    );

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { publishedAt } })
    );
    expect(publicContentCache.invalidateArticlePages).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', slug: 'two' }),
      expect.objectContaining({ id: '1', slug: 'one' })
    );
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

  it('tells the websites right when a revision scheduled less than a minute ahead goes live', async () => {
    const publishedAt = new Date('2026-10-01T10:00:20.000Z');
    prisma.articleRevision.findMany.mockImplementation(({ where }) =>
      Promise.resolve(
        where.publishedAt === publishedAt ?
          [{ article: { id: '1', slug: 'one' } }]
        : []
      )
    );

    watcher.schedule(publishedAt);
    await vi.advanceTimersByTimeAsync(19_000);
    expect(publicContentCache.invalidateArticlePages).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(4_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
    expect(publicContentCache.invalidateArticlePages).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', slug: 'one' })
    );
  });

  it('clears once when the same publication is scheduled and found upcoming', async () => {
    const publishedAt = new Date('2026-10-01T10:00:20.000Z');
    prisma.articleRevision.findMany.mockResolvedValue([{ publishedAt }]);

    watcher.schedule(publishedAt);
    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(25_000);

    expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
  });

  it('leaves publications in the past and more than a day ahead to the minute check', async () => {
    watcher.schedule(new Date('2026-10-01T09:59:00.000Z'));
    watcher.schedule(new Date('2026-10-02T10:00:01.000Z'));
    await vi.advanceTimersByTimeAsync(25 * 60 * 60 * 1000);

    expect(prisma.article.findMany).not.toHaveBeenCalled();
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();
  });

  describe('after a check that failed or ran late', () => {
    const publishedIn =
      (rows: Array<{ publishedAt: Date; id: string; slug: string }>) =>
      ({ where }: any) =>
        Promise.resolve(
          rows.filter(({ publishedAt }) =>
            where.publishedAt instanceof Date ?
              publishedAt.getTime() === where.publishedAt.getTime()
            : publishedAt > where.publishedAt.gt &&
              publishedAt <= where.publishedAt.lte
          )
        );
    const article = (publishedAt: string) => ({
      publishedAt: new Date(publishedAt),
      id: '1',
      slug: 'one',
    });

    it('still clears the caches for an article that went live while the database was unavailable', async () => {
      prisma.article.findMany.mockImplementation(
        publishedIn([article('2026-10-01T10:01:30.000Z')])
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      prisma.article.findMany.mockRejectedValueOnce(
        new Error('connection lost')
      );
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
      expect(publicContentCache.invalidateArticlePages).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', slug: 'one' })
      );
    });

    it('still clears the caches for an article that went live while a check ran late', async () => {
      prisma.article.findMany.mockImplementation(
        publishedIn([article('2026-10-01T10:01:12.000Z')])
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(75_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
    });

    it('clears once for an article it caught up on', async () => {
      prisma.article.findMany.mockImplementation(
        publishedIn([article('2026-10-01T10:01:30.000Z')])
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      prisma.article.findMany.mockRejectedValueOnce(
        new Error('connection lost')
      );
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });

    it('clears once for an article two checks found ahead', async () => {
      prisma.article.findMany.mockImplementation(
        publishedIn([article('2026-10-01T10:01:05.000Z')])
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps running when the database is unavailable', async () => {
    prisma.article.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
