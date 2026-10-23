import { EventSchedule, EventScheduleDate } from './event-schedule';
import { expandOccurrences } from './expand-occurrences';
import {
  isWithinScheduleHorizon,
  lastSchedulableDay,
  lastScheduledDate,
  scheduleHorizon,
} from './schedule-horizon';

const at = (value: string) => new Date(value);

const scheduleDate = (
  dateFrom: string,
  dateTo: string,
  sortOrder = 0
): EventScheduleDate => ({
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  openingTime: null,
  sortOrder,
  legacyEventId: null,
});

const schedule = (overrides: Partial<EventSchedule>): EventSchedule => ({
  scheduleType: 'Continuous',
  dateFrom: at('2026-11-01T18:00:00.000Z'),
  dateTo: at('2026-11-01T21:00:00.000Z'),
  weekDays: [],
  openingTime: null,
  dates: [],
  ...overrides,
});

const now = at('2026-10-23T10:00:00.000Z');
const horizon = '2028-10-23T21:59:59.999Z';
const offsetFromHorizon = (milliseconds: number) =>
  new Date(at(horizon).getTime() + milliseconds);

describe('lastSchedulableDay', () => {
  it('is the same Zurich calendar day two years on', () => {
    expect(lastSchedulableDay(now)).toEqual({ year: 2028, month: 10, day: 23 });
  });

  it('counts from the Zurich date when it is already tomorrow in Zurich', () => {
    expect(lastSchedulableDay(at('2026-10-23T22:30:00.000Z'))).toEqual({
      year: 2028,
      month: 10,
      day: 24,
    });
  });

  it('moves February 29 to February 28, never into March', () => {
    expect(lastSchedulableDay(at('2028-02-29T12:00:00.000Z'))).toEqual({
      year: 2030,
      month: 2,
      day: 28,
    });
  });

  it('does not move February 28 to February 29 in a leap year', () => {
    expect(lastSchedulableDay(at('2026-02-28T12:00:00.000Z'))).toEqual({
      year: 2028,
      month: 2,
      day: 28,
    });
  });

  it('is the same day from the first to the last moment of today', () => {
    const day = { year: 2028, month: 10, day: 23 };

    expect(lastSchedulableDay(at('2026-10-22T22:00:00.000Z'))).toEqual(day);
    expect(lastSchedulableDay(at('2026-10-23T21:59:59.999Z'))).toEqual(day);
  });
});

describe('scheduleHorizon', () => {
  it('is the last millisecond of the Zurich day two years on', () => {
    expect(scheduleHorizon(now)).toEqual(at(horizon));
  });

  it('does not depend on the time of day of now', () => {
    expect(scheduleHorizon(at('2026-10-22T22:00:00.000Z'))).toEqual(
      at(horizon)
    );
    expect(scheduleHorizon(at('2026-10-23T21:59:59.999Z'))).toEqual(
      at(horizon)
    );
  });

  it('uses the offset of the horizon day, not of today', () => {
    expect(scheduleHorizon(at('2026-10-27T10:00:00.000Z'))).toEqual(
      at('2028-10-27T21:59:59.999Z')
    );
    expect(scheduleHorizon(at('2026-03-27T12:00:00.000Z'))).toEqual(
      at('2028-03-27T21:59:59.999Z')
    );
  });

  it('ends the 23-hour day when the clocks go forward', () => {
    expect(scheduleHorizon(at('2026-03-26T12:00:00.000Z'))).toEqual(
      at('2028-03-26T21:59:59.999Z')
    );
  });

  it('ends the 25-hour day when the clocks go back', () => {
    expect(scheduleHorizon(at('2026-10-29T12:00:00.000Z'))).toEqual(
      at('2028-10-29T22:59:59.999Z')
    );
  });

  it('ends February 28 when today is February 29', () => {
    expect(scheduleHorizon(at('2028-02-28T23:30:00.000Z'))).toEqual(
      at('2030-02-28T22:59:59.999Z')
    );
  });

  it('returns a new Date', () => {
    const input = at('2026-10-23T10:00:00.000Z');

    expect(scheduleHorizon(input)).not.toBe(input);
    expect(input).toEqual(at('2026-10-23T10:00:00.000Z'));
  });
});

describe('lastScheduledDate', () => {
  it('is dateTo for a Continuous schedule', () => {
    expect(
      lastScheduledDate(schedule({ dateTo: at('2027-05-01T18:00:00.000Z') }))
    ).toEqual(at('2027-05-01T18:00:00.000Z'));
  });

  it('is dateTo for a Weekly schedule even when the last weekday falls earlier', () => {
    const weekly = schedule({
      scheduleType: 'Weekly',
      weekDays: [6],
      dateFrom: at('2026-10-24T11:00:00+02:00'),
      dateTo: at('2026-11-05T17:00:00+01:00'),
    });

    expect(lastScheduledDate(weekly)).toEqual(at('2026-11-05T17:00:00+01:00'));
    expect(
      expandOccurrences(weekly)[expandOccurrences(weekly).length - 1].dateTo
    ).toEqual(at('2026-10-31T17:00:00+01:00'));
  });

  it('is the latest dateTo of an Explicit schedule whatever the row order', () => {
    expect(
      lastScheduledDate(
        schedule({
          scheduleType: 'Explicit',
          dateTo: at('2099-12-31T21:00:00.000Z'),
          dates: [
            scheduleDate(
              '2027-06-01T18:00:00.000Z',
              '2027-06-01T21:00:00.000Z',
              0
            ),
            scheduleDate(
              '2027-09-01T18:00:00.000Z',
              '2027-09-02T01:00:00.000Z',
              1
            ),
            scheduleDate(
              '2027-07-01T18:00:00.000Z',
              '2027-07-01T21:00:00.000Z',
              2
            ),
          ],
        })
      )
    ).toEqual(at('2027-09-02T01:00:00.000Z'));
  });

  it('is null for an Explicit schedule without dates', () => {
    expect(
      lastScheduledDate(schedule({ scheduleType: 'Explicit', dates: [] }))
    ).toBeNull();
  });

  it('is null for a span without dateTo', () => {
    expect(lastScheduledDate(schedule({ dateTo: null }))).toBeNull();
    expect(
      lastScheduledDate(schedule({ scheduleType: 'Weekly', dateTo: null }))
    ).toBeNull();
  });

  it('returns a new Date', () => {
    const input = schedule({});

    expect(lastScheduledDate(input)).not.toBe(input.dateTo);
  });
});

describe('isWithinScheduleHorizon', () => {
  it('accepts an evening date on the horizon day after a midday save', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          dateFrom: at('2028-10-23T20:00:00+02:00'),
          dateTo: at('2028-10-23T23:00:00+02:00'),
        }),
        now
      )
    ).toBe(true);
  });

  it('rejects a date on the day after the horizon day', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          dateFrom: at('2028-10-24T10:00:00+02:00'),
          dateTo: at('2028-10-24T12:00:00+02:00'),
        }),
        now
      )
    ).toBe(false);
  });

  it('accepts a last date at the last millisecond of the horizon day', () => {
    expect(
      isWithinScheduleHorizon(schedule({ dateTo: at(horizon) }), now)
    ).toBe(true);
  });

  it('rejects a last date at midnight starting the next day', () => {
    expect(
      isWithinScheduleHorizon(schedule({ dateTo: offsetFromHorizon(1) }), now)
    ).toBe(false);
  });

  it('rejects at save but still expands everything, never truncating', () => {
    const tooLong = schedule({
      scheduleType: 'Weekly',
      weekDays: [1, 2, 3, 4, 5, 6, 7],
      dateFrom: at('2028-10-20T08:00:00.000Z'),
      dateTo: at('2028-10-26T09:00:00.000Z'),
    });

    expect(isWithinScheduleHorizon(tooLong, now)).toBe(false);
    expect(expandOccurrences(tooLong)).toHaveLength(7);
  });

  it('rejects a Weekly span past the horizon even when its last weekday is inside', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          scheduleType: 'Weekly',
          weekDays: [1],
          dateFrom: at('2028-10-02T18:00:00.000Z'),
          dateTo: at('2028-10-25T21:00:00.000Z'),
        }),
        now
      )
    ).toBe(false);
  });

  it('rejects an Explicit list whose latest date is past the horizon in any row', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          scheduleType: 'Explicit',
          dates: [
            scheduleDate(
              '2028-10-23T20:00:00.000Z',
              '2028-10-24T01:00:00.000Z',
              0
            ),
            scheduleDate(
              '2027-01-01T18:00:00.000Z',
              '2027-01-01T21:00:00.000Z',
              1
            ),
          ],
        }),
        now
      )
    ).toBe(false);
  });

  it('ignores a stale entity dateTo on an Explicit schedule', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          scheduleType: 'Explicit',
          dateTo: at('2099-12-31T21:00:00.000Z'),
          dates: [
            scheduleDate(
              '2027-01-01T18:00:00.000Z',
              '2027-01-01T21:00:00.000Z'
            ),
          ],
        }),
        now
      )
    ).toBe(true);
  });

  it('rejects an overnight date that starts before the horizon and ends after it', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          dateFrom: offsetFromHorizon(-2 * 60 * 60 * 1000),
          dateTo: offsetFromHorizon(60 * 60 * 1000),
        }),
        now
      )
    ).toBe(false);
  });

  it('accepts past schedules, the cap is a ceiling', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({
          dateFrom: at('2019-05-01T18:00:00.000Z'),
          dateTo: at('2019-05-01T21:00:00.000Z'),
        }),
        now
      )
    ).toBe(true);
  });

  it('accepts a schedule with nothing to cap', () => {
    expect(
      isWithinScheduleHorizon(
        schedule({ scheduleType: 'Explicit', dates: [] }),
        now
      )
    ).toBe(true);
    expect(isWithinScheduleHorizon(schedule({ dateTo: null }), now)).toBe(true);
  });
});
