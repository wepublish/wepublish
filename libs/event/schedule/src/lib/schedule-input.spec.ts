import { EventSchedule } from './event-schedule';
import { expandOccurrences } from './expand-occurrences';
import {
  hasRequiredWeekDays,
  hasValidWeekDays,
  validateScheduleInput,
} from './schedule-input';

const at = (value: string) => new Date(value);

const schedule = (overrides: Partial<EventSchedule>): EventSchedule => ({
  scheduleType: 'Weekly',
  dateFrom: at('2026-11-02T18:00:00.000Z'),
  dateTo: at('2026-11-30T21:00:00.000Z'),
  weekDays: [1],
  openingTime: null,
  dates: [],
  ...overrides,
});

const now = at('2026-10-23T10:00:00.000Z');

describe('hasRequiredWeekDays', () => {
  it('accepts a Weekly schedule with at least one weekday', () => {
    expect(hasRequiredWeekDays(schedule({ weekDays: [3] }))).toBe(true);
  });

  it('rejects a Weekly schedule without weekdays', () => {
    expect(hasRequiredWeekDays(schedule({ weekDays: [] }))).toBe(false);
  });

  it('does not require weekdays for Continuous and Explicit schedules', () => {
    expect(
      hasRequiredWeekDays(
        schedule({ scheduleType: 'Continuous', weekDays: [] })
      )
    ).toBe(true);
    expect(
      hasRequiredWeekDays(schedule({ scheduleType: 'Explicit', weekDays: [] }))
    ).toBe(true);
  });

  it('rejects new input that stored data may still hold and expand to nothing', () => {
    const stored = schedule({ weekDays: [] });

    expect(hasRequiredWeekDays(stored)).toBe(false);
    expect(expandOccurrences(stored)).toEqual([]);
  });
});

describe('hasValidWeekDays', () => {
  it('accepts every ISO weekday from Monday 1 to Sunday 7', () => {
    expect(
      hasValidWeekDays(schedule({ weekDays: [1, 2, 3, 4, 5, 6, 7] }))
    ).toBe(true);
  });

  it('accepts an empty list, which hasRequiredWeekDays judges', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [] }))).toBe(true);
  });

  it('rejects 0, the JavaScript getDay Sunday', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [0] }))).toBe(false);
  });

  it('rejects 8 and negative values', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [8] }))).toBe(false);
    expect(hasValidWeekDays(schedule({ weekDays: [-1] }))).toBe(false);
  });

  it('rejects one bad value among good ones', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [1, 3, 9] }))).toBe(false);
  });

  it('rejects values that are not whole numbers', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [1.5] }))).toBe(false);
    expect(hasValidWeekDays(schedule({ weekDays: [NaN] }))).toBe(false);
  });

  it('rejects a weekday listed twice', () => {
    expect(hasValidWeekDays(schedule({ weekDays: [1, 3, 1] }))).toBe(false);
  });

  it('checks the values whatever the schedule type', () => {
    expect(
      hasValidWeekDays(schedule({ scheduleType: 'Continuous', weekDays: [8] }))
    ).toBe(false);
    expect(
      hasValidWeekDays(schedule({ scheduleType: 'Explicit', weekDays: [0] }))
    ).toBe(false);
  });

  it('rejects new input that stored data may still hold, and expansion keeps only valid days', () => {
    const stored = schedule({
      dateFrom: at('2026-11-02T18:00:00.000Z'),
      dateTo: at('2026-11-10T21:00:00.000Z'),
      weekDays: [0, 1, 1, 8],
    });

    expect(hasValidWeekDays(stored)).toBe(false);
    expect(expandOccurrences(stored)).toEqual([
      expect.objectContaining({ dateFrom: at('2026-11-02T18:00:00.000Z') }),
      expect.objectContaining({ dateFrom: at('2026-11-09T18:00:00.000Z') }),
    ]);
  });

  it('expands stored data with only invalid weekdays to nothing without throwing', () => {
    expect(expandOccurrences(schedule({ weekDays: [0, 8, 1.5] }))).toEqual([]);
  });
});

describe('validateScheduleInput', () => {
  it('returns no errors for a valid schedule', () => {
    expect(validateScheduleInput(schedule({}), now)).toEqual([]);
  });

  it('reports a Weekly schedule without weekdays', () => {
    expect(validateScheduleInput(schedule({ weekDays: [] }), now)).toEqual([
      'MissingWeekDays',
    ]);
  });

  it('reports weekdays outside ISO 1 to 7', () => {
    expect(validateScheduleInput(schedule({ weekDays: [0, 1] }), now)).toEqual([
      'InvalidWeekDays',
    ]);
  });

  it('reports duplicate weekdays', () => {
    expect(validateScheduleInput(schedule({ weekDays: [2, 2] }), now)).toEqual([
      'InvalidWeekDays',
    ]);
  });

  it('accepts a date late on the last allowed day', () => {
    expect(
      validateScheduleInput(
        schedule({ dateTo: at('2028-10-23T23:30:00+02:00') }),
        now
      )
    ).toEqual([]);
  });

  it('reports a schedule past the horizon', () => {
    expect(
      validateScheduleInput(
        schedule({ dateTo: at('2028-10-24T00:00:00+02:00') }),
        now
      )
    ).toEqual(['BeyondScheduleHorizon']);
  });

  it('reports every problem at once', () => {
    expect(
      validateScheduleInput(
        schedule({ weekDays: [], dateTo: at('2030-01-01T00:00:00.000Z') }),
        now
      )
    ).toEqual(['MissingWeekDays', 'BeyondScheduleHorizon']);
    expect(
      validateScheduleInput(
        schedule({ weekDays: [8], dateTo: at('2030-01-01T00:00:00.000Z') }),
        now
      )
    ).toEqual(['InvalidWeekDays', 'BeyondScheduleHorizon']);
  });
});
