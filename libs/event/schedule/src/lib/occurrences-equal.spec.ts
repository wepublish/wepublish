import { EventSchedule } from './event-schedule';
import { expandOccurrences } from './expand-occurrences';
import { sameOccurrences } from './occurrences-equal';

const at = (value: string) => new Date(value);

const weekly: EventSchedule = {
  scheduleType: 'Weekly',
  dateFrom: at('2026-11-02T18:00:00.000Z'),
  dateTo: at('2026-11-30T21:00:00.000Z'),
  weekDays: [1, 4],
  openingTime: '18:30',
  dates: [],
};

const occurrence = (
  dateFrom: string,
  dateTo: string,
  openingTime: string | null = null,
  legacyEventId: bigint | null = null
) => ({
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  openingTime,
  legacyEventId,
});

describe('sameOccurrences', () => {
  it('treats identical lists as equal', () => {
    expect(
      sameOccurrences(
        [occurrence('2026-11-02T18:00:00.000Z', '2026-11-02T21:00:00.000Z')],
        [occurrence('2026-11-02T18:00:00.000Z', '2026-11-02T21:00:00.000Z')]
      )
    ).toBe(true);
  });

  it('treats two empty lists as equal', () => {
    expect(sameOccurrences([], [])).toBe(true);
  });

  it('treats a different order as unequal', () => {
    const first = occurrence(
      '2026-11-02T18:00:00.000Z',
      '2026-11-02T21:00:00.000Z'
    );
    const second = occurrence(
      '2026-11-05T18:00:00.000Z',
      '2026-11-05T21:00:00.000Z'
    );

    expect(sameOccurrences([first, second], [second, first])).toBe(false);
  });

  it('treats an openingTime change as unequal', () => {
    expect(
      sameOccurrences(
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            '18:30'
          ),
        ],
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            '19:00'
          ),
        ]
      )
    ).toBe(false);
  });

  it('treats a moved dateFrom or dateTo as unequal', () => {
    const stored = [
      occurrence('2026-11-02T18:00:00.000Z', '2026-11-02T21:00:00.000Z'),
    ];

    expect(
      sameOccurrences(stored, [
        occurrence('2026-11-02T18:00:00.001Z', '2026-11-02T21:00:00.000Z'),
      ])
    ).toBe(false);
    expect(
      sameOccurrences(stored, [
        occurrence('2026-11-02T18:00:00.000Z', '2026-11-02T22:00:00.000Z'),
      ])
    ).toBe(false);
  });

  it('treats a different legacyEventId as unequal', () => {
    expect(
      sameOccurrences(
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            null,
            1n
          ),
        ],
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            null,
            2n
          ),
        ]
      )
    ).toBe(false);
  });

  it('treats a dropped row as unequal', () => {
    const expanded = expandOccurrences(weekly);

    expect(sameOccurrences(expanded.slice(1), expanded)).toBe(false);
    expect(sameOccurrences(expanded, expanded.slice(1))).toBe(false);
  });

  it('matches an expanded list against the rows Prisma reads back', () => {
    const expanded = expandOccurrences(weekly);
    const stored = expanded.map((row, index) => ({
      id: `occurrence-${index}`,
      eventId: 'event',
      createdAt: at('2026-10-01T00:00:00.000Z'),
      dateFrom: new Date(row.dateFrom.getTime()),
      dateTo: new Date(row.dateTo.getTime()),
      openingTime: row.openingTime,
      legacyEventId:
        row.legacyEventId === null ? null : BigInt(row.legacyEventId),
    }));

    expect(expanded.length).toBeGreaterThan(0);
    expect(sameOccurrences(stored, expandOccurrences(weekly))).toBe(true);
  });

  it('compares legacy ids by value, not identity', () => {
    expect(
      sameOccurrences(
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            null,
            BigInt('9007199254740993')
          ),
        ],
        [
          occurrence(
            '2026-11-02T18:00:00.000Z',
            '2026-11-02T21:00:00.000Z',
            null,
            9007199254740993n
          ),
        ]
      )
    ).toBe(true);
  });
});
