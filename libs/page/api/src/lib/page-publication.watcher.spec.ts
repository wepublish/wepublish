import type { Mock } from 'vitest';
import { PagePublicationWatcher } from './page-publication.watcher';

describe('PagePublicationWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: {
    page: { findMany: Mock };
    pageRevision: { findMany: Mock };
  };
  let publicContentCache: { invalidate: Mock };
  let watcher: PagePublicationWatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = {
      page: { findMany: vi.fn().mockResolvedValue([]) },
      pageRevision: { findMany: vi.fn().mockResolvedValue([]) },
    };
    publicContentCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
    watcher = new PagePublicationWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    vi.useRealTimers();
  });

  it('clears cached pages and answers when a scheduled page goes live', async () => {
    prisma.page.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:30.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('pages');
  });

  it('also clears them when a scheduled revision of a published page goes live', async () => {
    prisma.pageRevision.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:10.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(publicContentCache.invalidate).toHaveBeenCalledWith('pages');
  });

  it('only asks for publications in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    const where = {
      publishedAt: { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') },
    };
    expect(prisma.page.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where })
    );
    expect(prisma.pageRevision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where })
    );
  });

  describe('after a check that failed or ran late', () => {
    const publishedIn =
      (...dates: string[]) =>
      ({ where }: any) =>
        Promise.resolve(
          dates
            .map(date => ({ publishedAt: new Date(date) }))
            .filter(
              ({ publishedAt }) =>
                publishedAt > where.publishedAt.gt &&
                publishedAt <= where.publishedAt.lte
            )
        );

    it('still clears the caches for a page that went live while the database was unavailable', async () => {
      prisma.pageRevision.findMany.mockImplementation(
        publishedIn('2026-10-01T10:01:30.000Z')
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      prisma.page.findMany.mockRejectedValueOnce(new Error('connection lost'));
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('pages');
    });

    it('still clears the caches for a page that went live while a check ran late', async () => {
      prisma.page.findMany.mockImplementation(
        publishedIn('2026-10-01T10:01:12.000Z')
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(75_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('pages');
    });

    it('clears once for a page it caught up on', async () => {
      prisma.page.findMany.mockImplementation(
        publishedIn('2026-10-01T10:01:30.000Z')
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      prisma.page.findMany.mockRejectedValueOnce(new Error('connection lost'));
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps running when the database is unavailable', async () => {
    prisma.page.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
