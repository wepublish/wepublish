import { EventScheduleType } from '@prisma/client';
import { EventSchedule, expandOccurrences } from '@wepublish/event/schedule';
import { eventSchedule, syncOccurrences } from './event-occurrences';

type Row = {
  id: string;
  eventId: string;
  dateFrom: Date;
  dateTo: Date;
  openingTime: string | null;
  legacyEventId: bigint | null;
};

const occurrenceTable = (initial: Row[] = []) => {
  let rows = [...initial];
  let nextId = initial.length;

  const occurrence = {
    findMany: vi.fn(async ({ where }: { where: { eventId: string } }) =>
      rows
        .filter(row => row.eventId === where.eventId)
        .sort(
          (a, b) =>
            a.dateFrom.getTime() - b.dateFrom.getTime() ||
            a.id.localeCompare(b.id)
        )
        .map(row => ({ ...row }))
    ),
    deleteMany: vi.fn(async ({ where }: { where: { eventId: string } }) => {
      rows = rows.filter(row => row.eventId !== where.eventId);
    }),
    createMany: vi.fn(async ({ data }: { data: Omit<Row, 'id'>[] }) => {
      rows.push(
        ...data.map(row => ({
          ...row,
          id: String(nextId++).padStart(6, '0'),
        }))
      );
    }),
  };

  return { occurrence, rows: () => rows };
};

const weekly: EventSchedule = {
  scheduleType: 'Weekly',
  dateFrom: new Date('2026-11-02T18:00:00.000Z'),
  dateTo: new Date('2026-11-30T21:00:00.000Z'),
  weekDays: [1, 3],
  openingTime: '18:30',
  dates: [],
};

describe('syncOccurrences', () => {
  it('writes exactly what the schedule expands to', async () => {
    const { occurrence } = occurrenceTable();

    expect(await syncOccurrences({ occurrence } as any, 'e1', weekly)).toBe(
      true
    );

    expect(occurrence.createMany).toHaveBeenCalledWith({
      data: expandOccurrences(weekly).map(expanded => ({
        ...expanded,
        eventId: 'e1',
      })),
    });
  });

  it('leaves the rows alone when the schedule did not change', async () => {
    const { occurrence } = occurrenceTable();

    await syncOccurrences({ occurrence } as any, 'e1', weekly);
    occurrence.deleteMany.mockClear();
    occurrence.createMany.mockClear();

    expect(await syncOccurrences({ occurrence } as any, 'e1', weekly)).toBe(
      false
    );
    expect(occurrence.deleteMany).not.toHaveBeenCalled();
    expect(occurrence.createMany).not.toHaveBeenCalled();
  });

  it('replaces the rows when the schedule changed', async () => {
    const { occurrence, rows } = occurrenceTable();

    await syncOccurrences({ occurrence } as any, 'e1', weekly);
    await syncOccurrences({ occurrence } as any, 'e1', {
      ...weekly,
      weekDays: [5],
    });

    expect(occurrence.deleteMany).toHaveBeenCalledWith({
      where: { eventId: 'e1' },
    });
    expect(rows().map(({ dateFrom }) => dateFrom)).toEqual(
      expandOccurrences({ ...weekly, weekDays: [5] }).map(
        ({ dateFrom }) => dateFrom
      )
    );
  });

  it('is idempotent: running it twice leaves identical rows', async () => {
    const { occurrence, rows } = occurrenceTable();

    await syncOccurrences({ occurrence } as any, 'e1', weekly);
    const first = rows().map(row => ({ ...row }));

    await syncOccurrences({ occurrence } as any, 'e1', weekly);

    expect(rows()).toEqual(first);
  });

  it('only deletes when the schedule expands to nothing', async () => {
    const { occurrence, rows } = occurrenceTable();

    await syncOccurrences({ occurrence } as any, 'e1', weekly);
    occurrence.createMany.mockClear();

    await syncOccurrences({ occurrence } as any, 'e1', {
      ...weekly,
      weekDays: [],
    });

    expect(occurrence.createMany).not.toHaveBeenCalled();
    expect(rows()).toEqual([]);
  });

  it('touches only the rows of its own event', async () => {
    const { occurrence, rows } = occurrenceTable([
      {
        id: 'other',
        eventId: 'e2',
        dateFrom: new Date('2026-11-01T10:00:00.000Z'),
        dateTo: new Date('2026-11-01T12:00:00.000Z'),
        openingTime: null,
        legacyEventId: null,
      },
    ]);

    await syncOccurrences({ occurrence } as any, 'e1', weekly);

    expect(rows().filter(({ eventId }) => eventId === 'e2')).toHaveLength(1);
  });
});

describe('eventSchedule', () => {
  it('reads the schedule off an event row and its dates', () => {
    expect(
      eventSchedule(
        {
          scheduleType: EventScheduleType.Explicit,
          dateFrom: null,
          dateTo: null,
          weekDays: [],
          openingTime: null,
        },
        [
          {
            dateFrom: new Date('2026-11-02T18:00:00.000Z'),
            dateTo: new Date('2026-11-02T20:00:00.000Z'),
            openingTime: '17:30',
            sortOrder: 1,
            legacyEventId: BigInt(7),
          },
        ]
      )
    ).toEqual({
      scheduleType: 'Explicit',
      dateFrom: null,
      dateTo: null,
      weekDays: [],
      openingTime: null,
      dates: [
        {
          dateFrom: new Date('2026-11-02T18:00:00.000Z'),
          dateTo: new Date('2026-11-02T20:00:00.000Z'),
          openingTime: '17:30',
          sortOrder: 1,
          legacyEventId: BigInt(7),
        },
      ],
    });
  });
});
