import { EventScheduleWatcher } from './event-schedule.watcher';

describe('EventScheduleWatcher', () => {
  const now = new Date('2026-10-01T10:00:00.000Z');
  let prisma: { event: { findMany: jest.Mock } };
  let publicContentCache: { invalidate: jest.Mock };
  let watcher: EventScheduleWatcher;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    prisma = { event: { findMany: jest.fn().mockResolvedValue([]) } };
    publicContentCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    watcher = new EventScheduleWatcher(
      prisma as any,
      publicContentCache as any
    );
  });

  afterEach(() => {
    watcher.onModuleDestroy();
    jest.useRealTimers();
  });

  it.each([
    [
      'starts',
      { startsAt: new Date('2026-10-01T10:00:20.000Z'), endsAt: null },
    ],
    [
      'ends',
      {
        startsAt: new Date('2026-10-01T08:00:00.000Z'),
        endsAt: new Date('2026-10-01T10:00:20.000Z'),
      },
    ],
  ])('clears cached answers once an event %s', async (_, event) => {
    prisma.event.findMany.mockResolvedValue([event]);

    await watcher.scheduleUpcoming();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(10_000);
    expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
  });

  it('only asks for events starting or ending in the next 70 seconds', async () => {
    await watcher.scheduleUpcoming();

    const window = { gt: now, lte: new Date('2026-10-01T10:01:10.000Z') };
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ startsAt: window }, { endsAt: window }] },
      })
    );
  });

  describe('after a check that failed or ran late', () => {
    const scheduled =
      (...events: Array<{ startsAt: Date; endsAt: Date | null }>) =>
      ({ where }: any) => {
        const [{ startsAt: window }] = where.OR;
        const inWindow = (date: Date | null) =>
          !!date && date > window.gt && date <= window.lte;

        return Promise.resolve(
          events.filter(
            ({ startsAt, endsAt }) => inWindow(startsAt) || inWindow(endsAt)
          )
        );
      };

    it.each([
      [
        'started',
        { startsAt: new Date('2026-10-01T10:01:30.000Z'), endsAt: null },
      ],
      [
        'ended',
        {
          startsAt: new Date('2026-10-01T08:00:00.000Z'),
          endsAt: new Date('2026-10-01T10:01:30.000Z'),
        },
      ],
    ])(
      'still clears cached answers for an event that %s while the database was unavailable',
      async (_, event) => {
        prisma.event.findMany.mockImplementation(scheduled(event));

        await watcher.scheduleUpcoming();
        await jest.advanceTimersByTimeAsync(60_000);
        prisma.event.findMany.mockRejectedValueOnce(
          new Error('connection lost')
        );
        await watcher.scheduleUpcoming();
        await jest.advanceTimersByTimeAsync(60_000);
        await watcher.scheduleUpcoming();
        await jest.advanceTimersByTimeAsync(5_000);

        expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
      }
    );

    it('still clears cached answers for an event that started while a check ran late', async () => {
      prisma.event.findMany.mockImplementation(
        scheduled({
          startsAt: new Date('2026-10-01T10:01:12.000Z'),
          endsAt: null,
        })
      );

      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(75_000);
      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(5_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });

    it('clears once for an event it caught up on', async () => {
      prisma.event.findMany.mockImplementation(
        scheduled({
          startsAt: new Date('2026-10-01T10:01:30.000Z'),
          endsAt: null,
        })
      );

      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(60_000);
      prisma.event.findMany.mockRejectedValueOnce(new Error('connection lost'));
      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(60_000);
      await watcher.scheduleUpcoming();
      await jest.advanceTimersByTimeAsync(60_000);

      expect(publicContentCache.invalidate).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps running when the database is unavailable', async () => {
    prisma.event.findMany.mockRejectedValue(new Error('connection lost'));

    await expect(watcher.scheduleUpcoming()).resolves.toBeUndefined();
  });
});
