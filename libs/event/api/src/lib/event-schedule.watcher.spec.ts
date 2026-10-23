import type { Mock } from 'vitest';
import { EventScheduleWatcher } from './event-schedule.watcher';

describe('EventScheduleWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: {
    occurrence: { findMany: Mock };
    eventRevision: { findMany: Mock };
  };
  let publicContentCache: { invalidate: Mock };
  let watcher: EventScheduleWatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = {
      occurrence: { findMany: vi.fn().mockResolvedValue([]) },
      eventRevision: { findMany: vi.fn().mockResolvedValue([]) },
    };
    publicContentCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
    watcher = new EventScheduleWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    vi.useRealTimers();
  });

  it.each([
    [
      'starts',
      {
        dateFrom: new Date('2026-10-01T10:00:20.000Z'),
        dateTo: new Date('2026-10-01T12:00:00.000Z'),
      },
    ],
    [
      'ends',
      {
        dateFrom: new Date('2026-10-01T08:00:00.000Z'),
        dateTo: new Date('2026-10-01T10:00:20.000Z'),
      },
    ],
  ])('clears cached answers once an occurrence %s', async (_, event) => {
    prisma.occurrence.findMany.mockResolvedValue([event]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('events');
  });

  it('clears cached answers once a scheduled revision goes live', async () => {
    prisma.eventRevision.findMany.mockResolvedValue([
      { publishedAt: new Date('2026-10-01T10:00:20.000Z') },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('events');
  });

  it('asks for revisions going live in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    expect(prisma.eventRevision.findMany).toHaveBeenCalledWith({
      where: {
        publishedAt: { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') },
      },
      select: { publishedAt: true },
    });
  });

  it('ignores dates outside the window', async () => {
    prisma.occurrence.findMany.mockResolvedValue([
      {
        dateFrom: new Date('2026-09-01T10:00:00.000Z'),
        dateTo: new Date('2026-12-01T10:00:00.000Z'),
      },
    ]);

    await watcher.scheduleUpcoming();
    await vi.advanceTimersByTimeAsync(120_000);

    expect(publicContentCache.invalidate).not.toHaveBeenCalled();
  });

  it('only asks for occurrences starting or ending in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    const window = { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') };
    expect(prisma.occurrence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ dateFrom: window }, { dateTo: window }] },
      })
    );
  });

  describe('after a check that failed or ran late', () => {
    const scheduled =
      (...events: Array<{ dateFrom: Date; dateTo: Date }>) =>
      ({ where }: any) => {
        const [{ dateFrom: window }] = where.OR;
        const inWindow = (date: Date) =>
          !!date && date > window.gt && date <= window.lte;

        return Promise.resolve(
          events.filter(
            ({ dateFrom, dateTo }) => inWindow(dateFrom) || inWindow(dateTo)
          )
        );
      };

    it.each([
      [
        'started',
        {
          dateFrom: new Date('2026-10-01T10:01:30.000Z'),
          dateTo: new Date('2026-10-01T12:00:00.000Z'),
        },
      ],
      [
        'ended',
        {
          dateFrom: new Date('2026-10-01T08:00:00.000Z'),
          dateTo: new Date('2026-10-01T10:01:30.000Z'),
        },
      ],
    ])(
      'still clears cached answers for an event that %s while the database was unavailable',
      async (_, event) => {
        prisma.occurrence.findMany.mockImplementation(scheduled(event));

        await watcher.scheduleUpcoming();
        await vi.advanceTimersByTimeAsync(60_000);
        prisma.occurrence.findMany.mockRejectedValueOnce(
          new Error('connection lost')
        );
        await watcher.scheduleUpcoming();
        await vi.advanceTimersByTimeAsync(60_000);
        await watcher.scheduleUpcoming();
        await vi.advanceTimersByTimeAsync(5_000);

        expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
      }
    );

    it('still clears cached answers for an event that started while a check ran late', async () => {
      prisma.occurrence.findMany.mockImplementation(
        scheduled({
          dateFrom: new Date('2026-10-01T10:01:12.000Z'),
          dateTo: new Date('2026-10-01T12:00:00.000Z'),
        })
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(75_000);
      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });

    it('clears once for an event it caught up on', async () => {
      prisma.occurrence.findMany.mockImplementation(
        scheduled({
          dateFrom: new Date('2026-10-01T10:01:30.000Z'),
          dateTo: new Date('2026-10-01T12:00:00.000Z'),
        })
      );

      await watcher.scheduleUpcoming();
      await vi.advanceTimersByTimeAsync(60_000);
      prisma.occurrence.findMany.mockRejectedValueOnce(
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
  });

  it('keeps running when the database is unavailable', async () => {
    prisma.occurrence.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
