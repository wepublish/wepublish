import { PrismaClient } from '@prisma/client';
import { EventOccurrenceSummaryDataloader } from './event-occurrence-summary.dataloader';

const NOW = new Date('2026-10-23T10:00:00.000Z');

const occurrence = (id: string, eventId: string, dateFrom: string) => ({
  id,
  eventId,
  dateFrom: new Date(dateFrom),
  dateTo: new Date(new Date(dateFrom).getTime() + 2 * 60 * 60 * 1000),
  openingTime: null,
  legacyEventId: null,
  createdAt: NOW,
  modifiedAt: NOW,
});

const setup = () => {
  const prisma = {
    occurrence: {
      groupBy: vi.fn().mockResolvedValue([
        {
          eventId: 'weekly',
          _min: { dateFrom: new Date('2026-10-26T18:00:00.000Z') },
          _count: { _all: 4 },
        },
        {
          eventId: 'single',
          _min: { dateFrom: new Date('2026-11-01T18:00:00.000Z') },
          _count: { _all: 1 },
        },
      ]),
      findMany: vi
        .fn()
        .mockResolvedValue([
          occurrence('occ-weekly', 'weekly', '2026-10-26T18:00:00.000Z'),
          occurrence('occ-weekly-tie', 'weekly', '2026-10-26T18:00:00.000Z'),
          occurrence('occ-single', 'single', '2026-11-01T18:00:00.000Z'),
        ]),
    },
  };

  return {
    prisma,
    loader: new EventOccurrenceSummaryDataloader(
      prisma as unknown as PrismaClient
    ),
  };
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EventOccurrenceSummaryDataloader', () => {
  it('summarises a batch of events with one grouped query', async () => {
    const { prisma, loader } = setup();

    const [weekly, single, past] = await Promise.all([
      loader.load('weekly'),
      loader.load('single'),
      loader.load('past'),
    ]);

    expect(prisma.occurrence.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.occurrence.groupBy).toHaveBeenCalledWith({
      by: ['eventId'],
      where: {
        eventId: { in: ['weekly', 'single', 'past'] },
        dateTo: { gte: NOW },
      },
      _min: { dateFrom: true },
      _count: { _all: true },
    });
    expect(prisma.occurrence.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.occurrence.findMany).toHaveBeenCalledWith({
      where: {
        dateTo: { gte: NOW },
        OR: [
          {
            eventId: 'weekly',
            dateFrom: new Date('2026-10-26T18:00:00.000Z'),
          },
          {
            eventId: 'single',
            dateFrom: new Date('2026-11-01T18:00:00.000Z'),
          },
        ],
      },
      orderBy: [{ dateFrom: 'asc' }, { id: 'asc' }],
    });
    expect(weekly).toEqual({
      next: expect.objectContaining({ id: 'occ-weekly' }),
      upcomingCount: 4,
    });
    expect(single).toEqual({
      next: expect.objectContaining({ id: 'occ-single' }),
      upcomingCount: 1,
    });
    expect(past).toEqual({ next: null, upcomingCount: 0 });
  });

  it('skips the second query when nothing is upcoming', async () => {
    const { prisma, loader } = setup();
    prisma.occurrence.groupBy.mockResolvedValue([]);

    expect(await loader.load('past')).toEqual({ next: null, upcomingCount: 0 });
    expect(prisma.occurrence.findMany).not.toHaveBeenCalled();
  });
});
