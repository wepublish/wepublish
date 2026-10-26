import { runInThisContext } from 'vm';
import {
  EventSchedule,
  EventScheduleDate,
  EventScheduleType,
  ExpandedOccurrence,
} from './event-schedule';
import { expandOccurrences } from './expand-occurrences';

const hostProcessEnv: NodeJS.ProcessEnv = runInThisContext('process.env');

const at = (value: string) => new Date(value);

const scheduleDate = (
  dateFrom: string,
  dateTo: string,
  overrides: Partial<EventScheduleDate> = {}
): EventScheduleDate => ({
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  openingTime: null,
  sortOrder: 0,
  legacyEventId: null,
  ...overrides,
});

const continuous = (
  dateFrom: string,
  dateTo: string,
  overrides: Partial<EventSchedule> = {}
): EventSchedule => ({
  scheduleType: 'Continuous',
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  weekDays: [],
  openingTime: null,
  dates: [],
  ...overrides,
});

const weekly = (
  weekDays: number[],
  dateFrom: string,
  dateTo: string,
  overrides: Partial<EventSchedule> = {}
): EventSchedule => ({
  scheduleType: 'Weekly',
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  weekDays,
  openingTime: null,
  dates: [],
  ...overrides,
});

const explicit = (
  dates: EventScheduleDate[],
  overrides: Partial<EventSchedule> = {}
): EventSchedule => ({
  scheduleType: 'Explicit',
  dateFrom: null,
  dateTo: null,
  weekDays: [],
  openingTime: null,
  dates,
  ...overrides,
});

const spans = (occurrences: ExpandedOccurrence[]) =>
  occurrences.map(({ dateFrom, dateTo }) => [
    dateFrom.toISOString(),
    dateTo.toISOString(),
  ]);

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
};

const inputTimestamps = (schedule: EventSchedule) => [
  schedule.dateFrom?.getTime(),
  schedule.dateTo?.getTime(),
  ...schedule.dates.flatMap(date => [
    date.dateFrom.getTime(),
    date.dateTo.getTime(),
  ]),
];

describe('expandOccurrences', () => {
  describe('Continuous', () => {
    it('gives one occurrence spanning the whole schedule', () => {
      expect(
        expandOccurrences(
          continuous('2026-05-09T18:00:00.000Z', '2026-05-09T21:00:00.000Z', {
            openingTime: '19:30',
          })
        )
      ).toEqual([
        {
          dateFrom: at('2026-05-09T18:00:00.000Z'),
          dateTo: at('2026-05-09T21:00:00.000Z'),
          openingTime: '19:30',
          legacyEventId: null,
        },
      ]);
    });

    it('passes a multi-day exhibition across the March DST change through unchanged', () => {
      expect(
        spans(
          expandOccurrences(
            continuous('2026-03-20T09:00:00.000Z', '2026-04-10T16:00:00.000Z')
          )
        )
      ).toEqual([['2026-03-20T09:00:00.000Z', '2026-04-10T16:00:00.000Z']]);
    });

    it('passes an overnight span through unchanged', () => {
      expect(
        spans(
          expandOccurrences(
            continuous('2026-05-09T22:00:00+02:00', '2026-05-10T03:00:00+02:00')
          )
        )
      ).toEqual([['2026-05-09T20:00:00.000Z', '2026-05-10T01:00:00.000Z']]);
    });

    it('ignores leftover weekdays and dates', () => {
      expect(
        expandOccurrences(
          continuous('2026-05-09T18:00:00.000Z', '2026-05-12T21:00:00.000Z', {
            weekDays: [1, 2],
            dates: [
              scheduleDate(
                '2026-06-01T18:00:00.000Z',
                '2026-06-01T21:00:00.000Z',
                { openingTime: '18:00', legacyEventId: 1n }
              ),
            ],
          })
        )
      ).toEqual([
        {
          dateFrom: at('2026-05-09T18:00:00.000Z'),
          dateTo: at('2026-05-12T21:00:00.000Z'),
          openingTime: null,
          legacyEventId: null,
        },
      ]);
    });

    it('throws without dateFrom or dateTo', () => {
      expect(() =>
        expandOccurrences(
          continuous('2026-05-09T18:00:00.000Z', '2026-05-09T21:00:00.000Z', {
            dateFrom: null,
          })
        )
      ).toThrow();
      expect(() =>
        expandOccurrences(
          continuous('2026-05-09T18:00:00.000Z', '2026-05-09T21:00:00.000Z', {
            dateTo: null,
          })
        )
      ).toThrow();
    });
  });

  describe('Explicit', () => {
    it('maps each date to one occurrence with its own times and legacy id', () => {
      expect(
        expandOccurrences(
          explicit([
            scheduleDate(
              '2026-05-12T18:00:00.000Z',
              '2026-05-12T21:00:00.000Z',
              {
                openingTime: '19:30',
                legacyEventId: 34061n,
              }
            ),
            scheduleDate(
              '2026-05-19T17:00:00.000Z',
              '2026-05-19T20:00:00.000Z',
              {
                sortOrder: 1,
              }
            ),
          ])
        )
      ).toEqual([
        {
          dateFrom: at('2026-05-12T18:00:00.000Z'),
          dateTo: at('2026-05-12T21:00:00.000Z'),
          openingTime: '19:30',
          legacyEventId: 34061n,
        },
        {
          dateFrom: at('2026-05-19T17:00:00.000Z'),
          dateTo: at('2026-05-19T20:00:00.000Z'),
          openingTime: null,
          legacyEventId: null,
        },
      ]);
    });

    it("uses each date's opening time, never the entity's", () => {
      const occurrences = expandOccurrences(
        explicit(
          [
            scheduleDate(
              '2026-05-12T18:00:00.000Z',
              '2026-05-12T21:00:00.000Z'
            ),
            scheduleDate(
              '2026-05-13T18:00:00.000Z',
              '2026-05-13T21:00:00.000Z',
              {
                openingTime: '18:30',
                sortOrder: 1,
              }
            ),
          ],
          { openingTime: '19:00' }
        )
      );

      expect(occurrences.map(({ openingTime }) => openingTime)).toEqual([
        null,
        '18:30',
      ]);
    });

    it('orders chronologically regardless of sortOrder', () => {
      expect(
        spans(
          expandOccurrences(
            explicit([
              scheduleDate(
                '2026-05-13T18:00:00.000Z',
                '2026-05-13T21:00:00.000Z',
                {
                  sortOrder: 0,
                }
              ),
              scheduleDate(
                '2026-05-12T18:00:00.000Z',
                '2026-05-12T21:00:00.000Z',
                {
                  sortOrder: 1,
                }
              ),
            ])
          )
        )
      ).toEqual([
        ['2026-05-12T18:00:00.000Z', '2026-05-12T21:00:00.000Z'],
        ['2026-05-13T18:00:00.000Z', '2026-05-13T21:00:00.000Z'],
      ]);
    });

    it('orders equal starts by end, then by sortOrder', () => {
      const occurrences = expandOccurrences(
        explicit([
          scheduleDate('2026-05-12T18:00:00.000Z', '2026-05-12T22:00:00.000Z', {
            sortOrder: 0,
            legacyEventId: 1n,
          }),
          scheduleDate('2026-05-12T18:00:00.000Z', '2026-05-12T21:00:00.000Z', {
            sortOrder: 3,
            legacyEventId: 2n,
          }),
          scheduleDate('2026-05-12T18:00:00.000Z', '2026-05-12T21:00:00.000Z', {
            sortOrder: 2,
            legacyEventId: 3n,
          }),
        ])
      );

      expect(occurrences.map(({ legacyEventId }) => legacyEventId)).toEqual([
        3n,
        2n,
        1n,
      ]);
    });

    it('keeps identical dates instead of merging them', () => {
      expect(
        expandOccurrences(
          explicit([
            scheduleDate(
              '2026-05-12T18:00:00.000Z',
              '2026-05-12T21:00:00.000Z'
            ),
            scheduleDate(
              '2026-05-12T18:00:00.000Z',
              '2026-05-12T21:00:00.000Z',
              {
                sortOrder: 1,
              }
            ),
          ])
        )
      ).toHaveLength(2);
    });

    it('gives nothing for an empty list and ignores the span and weekdays', () => {
      expect(
        expandOccurrences(
          explicit([], {
            dateFrom: at('2026-05-01T10:00:00.000Z'),
            dateTo: at('2026-05-31T12:00:00.000Z'),
            weekDays: [1, 2, 3, 4, 5, 6, 7],
          })
        )
      ).toEqual([]);
    });

    it('passes overnight, DST-Sunday and leap-day dates through unchanged', () => {
      expect(
        spans(
          expandOccurrences(
            explicit([
              scheduleDate(
                '2026-03-28T22:00:00+01:00',
                '2026-03-29T04:00:00+02:00'
              ),
              scheduleDate(
                '2026-10-25T02:30:00+02:00',
                '2026-10-25T02:30:00+01:00',
                {
                  sortOrder: 1,
                }
              ),
              scheduleDate(
                '2028-02-29T19:00:00+01:00',
                '2028-02-29T22:00:00+01:00',
                {
                  sortOrder: 2,
                }
              ),
            ])
          )
        )
      ).toEqual([
        ['2026-03-28T21:00:00.000Z', '2026-03-29T02:00:00.000Z'],
        ['2026-10-25T00:30:00.000Z', '2026-10-25T01:30:00.000Z'],
        ['2028-02-29T18:00:00.000Z', '2028-02-29T21:00:00.000Z'],
      ]);
    });
  });

  describe('Weekly', () => {
    it('emits each selected weekday at the local start and end time', () => {
      expect(
        spans(
          expandOccurrences(
            weekly(
              [6],
              '2026-05-02T11:00:00+02:00',
              '2026-05-23T17:00:00+02:00'
            )
          )
        )
      ).toEqual([
        ['2026-05-02T09:00:00.000Z', '2026-05-02T15:00:00.000Z'],
        ['2026-05-09T09:00:00.000Z', '2026-05-09T15:00:00.000Z'],
        ['2026-05-16T09:00:00.000Z', '2026-05-16T15:00:00.000Z'],
        ['2026-05-23T09:00:00.000Z', '2026-05-23T15:00:00.000Z'],
      ]);
    });

    describe('weekday numbering is ISO, 1 = Monday to 7 = Sunday', () => {
      const span = [
        '2026-05-04T10:00:00+02:00',
        '2026-05-17T12:00:00+02:00',
      ] as const;

      it('reads 7 as Sunday', () => {
        expect(spans(expandOccurrences(weekly([7], ...span)))).toEqual([
          ['2026-05-10T08:00:00.000Z', '2026-05-10T10:00:00.000Z'],
          ['2026-05-17T08:00:00.000Z', '2026-05-17T10:00:00.000Z'],
        ]);
      });

      it('reads 1 as Monday', () => {
        expect(spans(expandOccurrences(weekly([1], ...span)))).toEqual([
          ['2026-05-04T08:00:00.000Z', '2026-05-04T10:00:00.000Z'],
          ['2026-05-11T08:00:00.000Z', '2026-05-11T10:00:00.000Z'],
        ]);
      });

      it('never matches 0 or 8', () => {
        expect(expandOccurrences(weekly([0], ...span))).toEqual([]);
        expect(expandOccurrences(weekly([8], ...span))).toEqual([]);
      });

      it('ignores the order and duplicates of weekdays and emits chronologically', () => {
        const expected = [
          ['2026-05-05T08:00:00.000Z', '2026-05-05T10:00:00.000Z'],
          ['2026-05-09T08:00:00.000Z', '2026-05-09T10:00:00.000Z'],
          ['2026-05-12T08:00:00.000Z', '2026-05-12T10:00:00.000Z'],
          ['2026-05-16T08:00:00.000Z', '2026-05-16T10:00:00.000Z'],
        ];

        expect(spans(expandOccurrences(weekly([6, 2], ...span)))).toEqual(
          expected
        );
        expect(spans(expandOccurrences(weekly([2, 6], ...span)))).toEqual(
          expected
        );
        expect(spans(expandOccurrences(weekly([6, 6, 2], ...span)))).toEqual(
          expected
        );
      });
    });

    it('gives nothing for empty weekdays', () => {
      expect(
        expandOccurrences(
          weekly([], '2026-05-02T11:00:00+02:00', '2026-05-23T17:00:00+02:00')
        )
      ).toEqual([]);
    });

    it('gives one occurrence for a single-day series on the right weekday', () => {
      expect(
        spans(
          expandOccurrences(
            weekly(
              [6],
              '2026-05-02T11:00:00+02:00',
              '2026-05-02T17:00:00+02:00'
            )
          )
        )
      ).toEqual([['2026-05-02T09:00:00.000Z', '2026-05-02T15:00:00.000Z']]);
    });

    it('gives nothing for a single-day series on another weekday', () => {
      expect(
        expandOccurrences(
          weekly([5], '2026-05-02T11:00:00+02:00', '2026-05-02T17:00:00+02:00')
        )
      ).toEqual([]);
    });

    it('gives nothing when dateTo is before dateFrom', () => {
      expect(
        expandOccurrences(
          weekly([6], '2026-05-16T11:00:00+02:00', '2026-05-02T17:00:00+02:00')
        )
      ).toEqual([]);
    });

    it('throws without dateFrom or dateTo', () => {
      expect(() =>
        expandOccurrences(
          weekly(
            [6],
            '2026-05-02T11:00:00+02:00',
            '2026-05-23T17:00:00+02:00',
            {
              dateFrom: null,
            }
          )
        )
      ).toThrow();
      expect(() =>
        expandOccurrences(
          weekly(
            [6],
            '2026-05-02T11:00:00+02:00',
            '2026-05-23T17:00:00+02:00',
            {
              dateTo: null,
            }
          )
        )
      ).toThrow();
    });

    it('copies the entity opening time, ignores dates and has no legacy id', () => {
      const occurrences = expandOccurrences(
        weekly([6], '2026-05-02T11:00:00+02:00', '2026-05-09T17:00:00+02:00', {
          openingTime: '19:30',
          dates: [
            scheduleDate(
              '2026-06-01T18:00:00.000Z',
              '2026-06-01T21:00:00.000Z',
              {
                legacyEventId: 7n,
              }
            ),
          ],
        })
      );

      expect(occurrences).toEqual([
        {
          dateFrom: at('2026-05-02T09:00:00.000Z'),
          dateTo: at('2026-05-02T15:00:00.000Z'),
          openingTime: '19:30',
          legacyEventId: null,
        },
        {
          dateFrom: at('2026-05-09T09:00:00.000Z'),
          dateTo: at('2026-05-09T15:00:00.000Z'),
          openingTime: '19:30',
          legacyEventId: null,
        },
      ]);
    });

    describe('end bound, exclusive on the full timestamp', () => {
      it('includes the final day when its start is before dateTo (BKa event 17413)', () => {
        const occurrences = spans(
          expandOccurrences(
            weekly(
              [6],
              '2025-03-22T11:00:00+01:00',
              '2025-06-14T17:00:00+02:00'
            )
          )
        );

        expect(occurrences).toHaveLength(13);
        expect(occurrences[occurrences.length - 1]).toEqual([
          '2025-06-14T09:00:00.000Z',
          '2025-06-14T15:00:00.000Z',
        ]);
      });

      it('ends an overnight series on the last start before dateTo (BKa event 4040)', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [2],
                '2024-01-30T21:00:00+01:00',
                '2024-03-01T00:00:00+01:00'
              )
            )
          )
        ).toEqual([
          ['2024-01-30T20:00:00.000Z', '2024-01-30T23:00:00.000Z'],
          ['2024-02-06T20:00:00.000Z', '2024-02-06T23:00:00.000Z'],
          ['2024-02-13T20:00:00.000Z', '2024-02-13T23:00:00.000Z'],
          ['2024-02-20T20:00:00.000Z', '2024-02-20T23:00:00.000Z'],
          ['2024-02-27T20:00:00.000Z', '2024-02-27T23:00:00.000Z'],
        ]);
      });

      it('drops an overnight slot on the final weekday itself', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [7],
                '2026-05-04T20:00:00+02:00',
                '2026-05-17T00:30:00+02:00'
              )
            )
          )
        ).toEqual([['2026-05-10T18:00:00.000Z', '2026-05-10T22:30:00.000Z']]);
      });

      it('gives zero-length occurrences and drops the final day for equal times', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-05-02T20:00:00+02:00',
                '2026-05-16T20:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-05-02T18:00:00.000Z', '2026-05-02T18:00:00.000Z'],
          ['2026-05-09T18:00:00.000Z', '2026-05-09T18:00:00.000Z'],
        ]);
      });
    });

    it('ends overnight slots on the next day (BKa event 32459) in winter and summer', () => {
      expect(
        spans(
          expandOccurrences(
            weekly(
              [5, 6],
              '2026-01-23T20:00:00+01:00',
              '2026-01-26T00:30:00+01:00'
            )
          )
        )
      ).toEqual([
        ['2026-01-23T19:00:00.000Z', '2026-01-23T23:30:00.000Z'],
        ['2026-01-24T19:00:00.000Z', '2026-01-24T23:30:00.000Z'],
      ]);
      expect(
        spans(
          expandOccurrences(
            weekly(
              [5, 6],
              '2026-07-03T20:00:00+02:00',
              '2026-07-06T00:30:00+02:00'
            )
          )
        )
      ).toEqual([
        ['2026-07-03T18:00:00.000Z', '2026-07-03T22:30:00.000Z'],
        ['2026-07-04T18:00:00.000Z', '2026-07-04T22:30:00.000Z'],
      ]);
    });

    describe('seconds', () => {
      it('keeps the start seconds and drops the end seconds', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-05-02T11:00:30.500+02:00',
                '2026-05-16T17:00:45+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-05-02T09:00:30.500Z', '2026-05-02T15:00:00.000Z'],
          ['2026-05-09T09:00:30.500Z', '2026-05-09T15:00:00.000Z'],
          ['2026-05-16T09:00:30.500Z', '2026-05-16T15:00:00.000Z'],
        ]);
      });

      it('keeps start seconds on an overnight series across the March change', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [5, 6],
                '2026-03-20T20:00:30.250+01:00',
                '2026-04-11T00:30:45+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-20T19:00:30.250Z', '2026-03-20T23:30:00.000Z'],
          ['2026-03-21T19:00:30.250Z', '2026-03-21T23:30:00.000Z'],
          ['2026-03-27T19:00:30.250Z', '2026-03-27T23:30:00.000Z'],
          ['2026-03-28T19:00:30.250Z', '2026-03-28T23:30:00.000Z'],
          ['2026-04-03T18:00:30.250Z', '2026-04-03T22:30:00.000Z'],
          ['2026-04-04T18:00:30.250Z', '2026-04-04T22:30:00.000Z'],
          ['2026-04-10T18:00:30.250Z', '2026-04-10T22:30:00.000Z'],
        ]);
      });

      it('ends before it starts when the times share a minute and the start has seconds', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-03-21T20:00:30.500+01:00',
                '2026-04-04T20:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-21T19:00:30.500Z', '2026-03-21T19:00:00.000Z'],
          ['2026-03-28T19:00:30.500Z', '2026-03-28T19:00:00.000Z'],
        ]);
      });
    });

    const marchSeries = () =>
      weekly([6], '2026-03-21T11:00:00+01:00', '2026-04-11T17:00:00+02:00');
    const octoberSeries = () =>
      weekly([6], '2026-10-17T11:00:00+02:00', '2026-10-31T17:00:00+01:00');
    const marchNight = () =>
      weekly([6], '2026-03-28T22:00:00+01:00', '2026-03-29T04:00:00+02:00');
    const octoberNight = () =>
      weekly([6], '2026-10-24T22:00:00+02:00', '2026-10-25T04:00:00+01:00');

    const marchSpans = [
      ['2026-03-21T10:00:00.000Z', '2026-03-21T16:00:00.000Z'],
      ['2026-03-28T10:00:00.000Z', '2026-03-28T16:00:00.000Z'],
      ['2026-04-04T09:00:00.000Z', '2026-04-04T15:00:00.000Z'],
      ['2026-04-11T09:00:00.000Z', '2026-04-11T15:00:00.000Z'],
    ];
    const octoberSpans = [
      ['2026-10-17T09:00:00.000Z', '2026-10-17T15:00:00.000Z'],
      ['2026-10-24T09:00:00.000Z', '2026-10-24T15:00:00.000Z'],
      ['2026-10-31T10:00:00.000Z', '2026-10-31T16:00:00.000Z'],
    ];
    const marchNightSpans = [
      ['2026-03-28T21:00:00.000Z', '2026-03-29T02:00:00.000Z'],
    ];
    const octoberNightSpans = [
      ['2026-10-24T20:00:00.000Z', '2026-10-25T03:00:00.000Z'],
    ];

    describe('across DST changes in Europe/Zurich', () => {
      it('keeps 11:00 local across the last Sunday in March', () => {
        expect(spans(expandOccurrences(marchSeries()))).toEqual(marchSpans);
      });

      it('keeps 11:00 local across the last Sunday in October', () => {
        expect(spans(expandOccurrences(octoberSeries()))).toEqual(octoberSpans);
      });

      it('keeps the BKa fixture of event 17413 across March 2025', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2025-03-22T11:00:00+01:00',
                '2025-04-12T17:00:00+02:00'
              )
            )
          ).slice(1, 3)
        ).toEqual([
          ['2025-03-29T10:00:00.000Z', '2025-03-29T16:00:00.000Z'],
          ['2025-04-05T09:00:00.000Z', '2025-04-05T15:00:00.000Z'],
        ]);
      });

      it('gives a slot over the spring night five real hours', () => {
        expect(spans(expandOccurrences(marchNight()))).toEqual(marchNightSpans);
      });

      it('gives a slot over the autumn night seven real hours', () => {
        expect(spans(expandOccurrences(octoberNight()))).toEqual(
          octoberNightSpans
        );
      });

      it('moves a start in the spring gap forward and keeps the moved time afterwards', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-03-21T02:30:00+01:00',
                '2026-04-11T04:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-21T01:30:00.000Z', '2026-03-21T03:00:00.000Z'],
          ['2026-03-28T01:30:00.000Z', '2026-03-28T03:00:00.000Z'],
          ['2026-04-04T01:30:00.000Z', '2026-04-04T02:00:00.000Z'],
          ['2026-04-11T01:30:00.000Z', '2026-04-11T02:00:00.000Z'],
        ]);
      });

      it('keeps the moved start on every day after the gap in a daily series', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [1, 2, 3, 4, 5, 6, 7],
                '2026-03-27T02:30:00+01:00',
                '2026-04-01T04:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-27T01:30:00.000Z', '2026-03-27T03:00:00.000Z'],
          ['2026-03-28T01:30:00.000Z', '2026-03-28T03:00:00.000Z'],
          ['2026-03-29T01:30:00.000Z', '2026-03-29T02:00:00.000Z'],
          ['2026-03-30T01:30:00.000Z', '2026-03-30T02:00:00.000Z'],
          ['2026-03-31T01:30:00.000Z', '2026-03-31T02:00:00.000Z'],
          ['2026-04-01T01:30:00.000Z', '2026-04-01T02:00:00.000Z'],
        ]);
      });

      it('moves a Sunday start in the gap and keeps it on later Sundays', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [7],
                '2026-03-22T02:30:00+01:00',
                '2026-04-05T04:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-22T01:30:00.000Z', '2026-03-22T03:00:00.000Z'],
          ['2026-03-29T01:30:00.000Z', '2026-03-29T02:00:00.000Z'],
          ['2026-04-05T01:30:00.000Z', '2026-04-05T02:00:00.000Z'],
        ]);
      });

      it('moves an overnight start in the gap and keeps it', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-03-21T02:30:00+01:00',
                '2026-04-11T01:00:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-21T01:30:00.000Z', '2026-03-22T00:00:00.000Z'],
          ['2026-03-28T01:30:00.000Z', '2026-03-29T00:00:00.000Z'],
          ['2026-04-04T01:30:00.000Z', '2026-04-04T23:00:00.000Z'],
        ]);
      });

      it('ends on the spring-forward Sunday with the summer offset', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [7],
                '2026-03-22T01:00:00+01:00',
                '2026-03-29T03:30:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-22T00:00:00.000Z', '2026-03-22T02:30:00.000Z'],
          ['2026-03-29T00:00:00.000Z', '2026-03-29T01:30:00.000Z'],
        ]);
      });

      it('moves an overnight end that falls in the spring gap forward', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-03-21T23:00:00+01:00',
                '2026-04-04T02:30:00+02:00'
              )
            )
          )
        ).toEqual([
          ['2026-03-21T22:00:00.000Z', '2026-03-22T01:30:00.000Z'],
          ['2026-03-28T22:00:00.000Z', '2026-03-29T01:30:00.000Z'],
        ]);
      });

      it('takes the first 02:30 of the autumn night when walking into it', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [1, 2, 3, 4, 5, 6, 7],
                '2026-10-23T02:30:00+02:00',
                '2026-10-28T04:00:00+01:00'
              )
            )
          )
        ).toEqual([
          ['2026-10-23T00:30:00.000Z', '2026-10-23T02:00:00.000Z'],
          ['2026-10-24T00:30:00.000Z', '2026-10-24T02:00:00.000Z'],
          ['2026-10-25T00:30:00.000Z', '2026-10-25T03:00:00.000Z'],
          ['2026-10-26T01:30:00.000Z', '2026-10-26T03:00:00.000Z'],
          ['2026-10-27T01:30:00.000Z', '2026-10-27T03:00:00.000Z'],
          ['2026-10-28T01:30:00.000Z', '2026-10-28T03:00:00.000Z'],
        ]);
      });

      it('ends a same-day slot in the autumn overlap with the offset of its start', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [7],
                '2026-10-18T01:00:00+02:00',
                '2026-11-01T02:30:00+01:00'
              )
            )
          )
        ).toEqual([
          ['2026-10-17T23:00:00.000Z', '2026-10-18T00:30:00.000Z'],
          ['2026-10-24T23:00:00.000Z', '2026-10-25T00:30:00.000Z'],
          ['2026-11-01T00:00:00.000Z', '2026-11-01T01:30:00.000Z'],
        ]);
      });

      it('ends an overnight slot in the autumn overlap at the second 02:30', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [6],
                '2026-10-17T22:00:00+02:00',
                '2026-10-31T02:30:00+01:00'
              )
            )
          )
        ).toEqual([
          ['2026-10-17T20:00:00.000Z', '2026-10-18T00:30:00.000Z'],
          ['2026-10-24T20:00:00.000Z', '2026-10-25T01:30:00.000Z'],
        ]);
      });

      it('keeps the winter offset of a start at the second 02:30', () => {
        expect(
          spans(
            expandOccurrences(
              weekly(
                [7],
                '2026-10-25T02:30:00+01:00',
                '2026-10-25T02:45:00+01:00'
              )
            )
          )
        ).toEqual([['2026-10-25T01:30:00.000Z', '2026-10-25T01:45:00.000Z']]);
      });
    });

    describe.each([
      ['UTC', 0],
      ['Europe/Zurich', -120],
      ['America/New_York', 240],
    ])('with the host process in %s', (timeZone, summerTimezoneOffset) => {
      const previousTimeZone = hostProcessEnv['TZ'];

      beforeAll(() => {
        hostProcessEnv['TZ'] = timeZone;
      });

      afterAll(() => {
        if (previousTimeZone === undefined) {
          delete hostProcessEnv['TZ'];
        } else {
          hostProcessEnv['TZ'] = previousTimeZone;
        }
      });

      it('runs in that zone', () => {
        expect(new Date('2026-07-03T18:00:00.000Z').getTimezoneOffset()).toBe(
          summerTimezoneOffset
        );
      });

      it('expands the DST series to the same instants', () => {
        expect(spans(expandOccurrences(marchSeries()))).toEqual(marchSpans);
        expect(spans(expandOccurrences(octoberSeries()))).toEqual(octoberSpans);
        expect(spans(expandOccurrences(marchNight()))).toEqual(marchNightSpans);
        expect(spans(expandOccurrences(octoberNight()))).toEqual(
          octoberNightSpans
        );
      });
    });

    it('includes February 29 in a leap year', () => {
      expect(
        spans(
          expandOccurrences(
            weekly(
              [2],
              '2028-02-22T10:00:00+01:00',
              '2028-03-07T12:00:00+01:00'
            )
          )
        )
      ).toEqual([
        ['2028-02-22T09:00:00.000Z', '2028-02-22T11:00:00.000Z'],
        ['2028-02-29T09:00:00.000Z', '2028-02-29T11:00:00.000Z'],
        ['2028-03-07T09:00:00.000Z', '2028-03-07T11:00:00.000Z'],
      ]);
    });

    it('gives a daily series 29 dates in February 2028', () => {
      const occurrences = spans(
        expandOccurrences(
          weekly(
            [1, 2, 3, 4, 5, 6, 7],
            '2028-02-01T10:00:00+01:00',
            '2028-02-29T12:00:00+01:00'
          )
        )
      );

      expect(occurrences).toHaveLength(29);
      expect(occurrences[occurrences.length - 1]).toEqual([
        '2028-02-29T09:00:00.000Z',
        '2028-02-29T11:00:00.000Z',
      ]);
    });

    it('crosses the year boundary without skipping or doubling a week', () => {
      expect(
        spans(
          expandOccurrences(
            weekly(
              [1],
              '2026-12-21T10:00:00+01:00',
              '2027-01-11T12:00:00+01:00'
            )
          )
        )
      ).toEqual([
        ['2026-12-21T09:00:00.000Z', '2026-12-21T11:00:00.000Z'],
        ['2026-12-28T09:00:00.000Z', '2026-12-28T11:00:00.000Z'],
        ['2027-01-04T09:00:00.000Z', '2027-01-04T11:00:00.000Z'],
        ['2027-01-11T09:00:00.000Z', '2027-01-11T11:00:00.000Z'],
      ]);
    });

    it('expands BKa event 27002 to its 12,374 occurrences without a cap', () => {
      const occurrences = spans(
        expandOccurrences(
          weekly(
            [2, 4, 5],
            '2020-12-15T19:00:00+01:00',
            '2099-12-31T22:00:00+01:00'
          )
        )
      );

      expect(occurrences).toHaveLength(12_374);
      expect(occurrences.slice(0, 3)).toEqual([
        ['2020-12-15T18:00:00.000Z', '2020-12-15T21:00:00.000Z'],
        ['2020-12-17T18:00:00.000Z', '2020-12-17T21:00:00.000Z'],
        ['2020-12-18T18:00:00.000Z', '2020-12-18T21:00:00.000Z'],
      ]);
      expect(occurrences.slice(-3)).toEqual([
        ['2099-12-25T18:00:00.000Z', '2099-12-25T21:00:00.000Z'],
        ['2099-12-29T18:00:00.000Z', '2099-12-29T21:00:00.000Z'],
        ['2099-12-31T18:00:00.000Z', '2099-12-31T21:00:00.000Z'],
      ]);
    });
  });

  describe('purity', () => {
    const schedules = (): EventSchedule[] => [
      continuous('2026-05-09T18:00:00.000Z', '2026-05-09T21:00:00.000Z', {
        openingTime: '19:00',
      }),
      weekly(
        [5, 6],
        '2026-03-20T20:00:30.250+01:00',
        '2026-04-11T00:30:45+02:00',
        {
          openingTime: '19:30',
        }
      ),
      explicit([
        scheduleDate('2026-05-13T18:00:10.100Z', '2026-05-13T21:00:20.200Z', {
          legacyEventId: 34061n,
        }),
        scheduleDate('2026-05-12T18:00:00.000Z', '2026-05-12T21:00:00.000Z', {
          sortOrder: 1,
        }),
      ]),
    ];

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each(schedules().map(schedule => [schedule.scheduleType, schedule]))(
      'expands a frozen %s schedule to equal results twice',
      (_, schedule) => {
        const frozen = deepFreeze(schedule);

        expect(expandOccurrences(frozen)).toEqual(expandOccurrences(frozen));
      }
    );

    it.each(schedules().map(schedule => [schedule.scheduleType, schedule]))(
      'leaves every input timestamp of a %s schedule untouched',
      (_, schedule) => {
        const before = inputTimestamps(schedule);

        expandOccurrences(schedule);

        expect(inputTimestamps(schedule)).toEqual(before);
      }
    );

    it.each(schedules().map(schedule => [schedule.scheduleType, schedule]))(
      'never returns input Date instances for a %s schedule',
      (_, schedule) => {
        const inputDates = [
          schedule.dateFrom,
          schedule.dateTo,
          ...schedule.dates.flatMap(date => [date.dateFrom, date.dateTo]),
        ];

        for (const occurrence of expandOccurrences(schedule)) {
          expect(inputDates).not.toContain(occurrence.dateFrom);
          expect(inputDates).not.toContain(occurrence.dateTo);
        }
      }
    );

    it('does not share Date instances between occurrences', () => {
      const schedule = weekly(
        [1, 2, 3, 4, 5, 6, 7],
        '2026-05-02T11:00:00+02:00',
        '2026-05-05T11:00:00+02:00'
      );
      const occurrences = expandOccurrences(schedule);

      expect(occurrences).toHaveLength(3);
      expect(occurrences[0].dateFrom).not.toBe(occurrences[0].dateTo);

      occurrences[0].dateFrom.setTime(0);

      expect(occurrences[0].dateTo).toEqual(at('2026-05-02T11:00:00+02:00'));
      expect(occurrences[1].dateFrom).toEqual(at('2026-05-03T11:00:00+02:00'));
      expect(schedule.dateFrom).toEqual(at('2026-05-02T11:00:00+02:00'));
    });

    it('does not read the clock', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const results = [
        '2019-01-01T00:00:00.000Z',
        '2026-10-23T00:00:00.000Z',
        '2031-06-01T00:00:00.000Z',
      ].map(now => {
        vi.setSystemTime(at(now));

        return schedules().map(expandOccurrences);
      });

      expect(results[1]).toEqual(results[0]);
      expect(results[2]).toEqual(results[0]);
    });

    it('expands past schedules completely', () => {
      expect(
        expandOccurrences(
          weekly([6], '2019-01-05T11:00:00+01:00', '2019-12-28T17:00:00+01:00')
        )
      ).toHaveLength(52);
    });
  });

  it('throws for an unknown schedule type', () => {
    expect(() =>
      expandOccurrences({
        ...continuous('2026-05-09T18:00:00.000Z', '2026-05-09T21:00:00.000Z'),
        scheduleType: 'Monthly' as EventScheduleType,
      })
    ).toThrow();
  });
});
