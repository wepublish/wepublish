import { PagePublicationWatcher } from './page-publication.watcher';

describe('PagePublicationWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: {
    page: { findMany: jest.Mock };
    pageRevision: { findMany: jest.Mock };
  };
  let publicContentCache: { invalidate: jest.Mock };
  let watcher: PagePublicationWatcher;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    prisma = {
      page: { findMany: jest.fn().mockResolvedValue([]) },
      pageRevision: { findMany: jest.fn().mockResolvedValue([]) },
    };
    publicContentCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    watcher = new PagePublicationWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    jest.useRealTimers();
  });

  it('clears cached pages and answers when a scheduled page goes live', async () => {
    prisma.page.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:30.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await jest.advanceTimersByTimeAsync(20_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('pages');
  });

  it('also clears them when a scheduled revision of a published page goes live', async () => {
    prisma.pageRevision.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:10.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await jest.advanceTimersByTimeAsync(15_000);

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

  it('keeps running when the database is unavailable', async () => {
    prisma.page.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
