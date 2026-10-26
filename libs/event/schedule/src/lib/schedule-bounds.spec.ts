import { EventSchedule, EventScheduleDate } from './event-schedule';
import { scheduleBounds } from './schedule-bounds';

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

const schedule = (overrides: Partial<EventSchedule>): EventSchedule => ({
  scheduleType: 'Continuous',
  dateFrom: at('2026-11-02T18:00:00.000Z'),
  dateTo: at('2026-11-30T21:00:00.000Z'),
  weekDays: [],
  openingTime: null,
  dates: [],
  ...overrides,
});

describe('scheduleBounds', () => {
  it('returns the span of a Continuous schedule as given', () => {
    expect(scheduleBounds(schedule({}))).toEqual({
      firstDateAt: at('2026-11-02T18:00:00.000Z'),
      lastDateAt: at('2026-11-30T21:00:00.000Z'),
    });
  });

  it('returns the end of the span for a Weekly schedule, not the end of the last sitting', () => {
    expect(
      scheduleBounds(
        schedule({
          scheduleType: 'Weekly',
          weekDays: [1],
          dateFrom: at('2026-11-02T18:00:00.000Z'),
          dateTo: at('2026-11-29T21:00:00.000Z'),
        })
      )
    ).toEqual({
      firstDateAt: at('2026-11-02T18:00:00.000Z'),
      lastDateAt: at('2026-11-29T21:00:00.000Z'),
    });
  });

  it('still bounds a stored Weekly schedule without weekdays', () => {
    expect(
      scheduleBounds(schedule({ scheduleType: 'Weekly', weekDays: [] }))
    ).toEqual({
      firstDateAt: at('2026-11-02T18:00:00.000Z'),
      lastDateAt: at('2026-11-30T21:00:00.000Z'),
    });
  });

  it('returns null bounds for a span without dates', () => {
    expect(scheduleBounds(schedule({ dateFrom: null, dateTo: null }))).toEqual({
      firstDateAt: null,
      lastDateAt: null,
    });
  });

  it('returns the earliest start and the latest end of unsorted explicit dates', () => {
    expect(
      scheduleBounds(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          dates: [
            scheduleDate(
              '2026-12-05T19:00:00.000Z',
              '2026-12-05T21:00:00.000Z'
            ),
            scheduleDate(
              '2026-11-10T19:00:00.000Z',
              '2026-12-20T21:00:00.000Z'
            ),
            scheduleDate(
              '2026-11-20T19:00:00.000Z',
              '2026-11-20T21:00:00.000Z'
            ),
          ],
        })
      )
    ).toEqual({
      firstDateAt: at('2026-11-10T19:00:00.000Z'),
      lastDateAt: at('2026-12-20T21:00:00.000Z'),
    });
  });

  it('ignores the span fields of an Explicit schedule', () => {
    expect(
      scheduleBounds(
        schedule({
          scheduleType: 'Explicit',
          dates: [
            scheduleDate(
              '2026-12-05T19:00:00.000Z',
              '2026-12-05T21:00:00.000Z'
            ),
          ],
        })
      )
    ).toEqual({
      firstDateAt: at('2026-12-05T19:00:00.000Z'),
      lastDateAt: at('2026-12-05T21:00:00.000Z'),
    });
  });

  it('returns null bounds for an Explicit schedule without dates', () => {
    expect(
      scheduleBounds(schedule({ scheduleType: 'Explicit', dates: [] }))
    ).toEqual({ firstDateAt: null, lastDateAt: null });
  });

  it('returns copies, so callers cannot mutate the schedule through them', () => {
    const input = schedule({});
    const { firstDateAt } = scheduleBounds(input);

    firstDateAt?.setTime(0);

    expect(input.dateFrom).toEqual(at('2026-11-02T18:00:00.000Z'));
  });
});
