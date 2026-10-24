import { EventScheduleType } from '@wepublish/editor/api';
import { expandOccurrences } from '@wepublish/event/schedule';
import type { Mock } from 'vitest';

import { previewOccurrences } from './occurrence-preview';
import { emptyScheduleForm, ScheduleForm } from './schedule-form';

vi.mock('@wepublish/event/schedule', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@wepublish/event/schedule')>();

  return { ...actual, expandOccurrences: vi.fn(actual.expandOccurrences) };
});

const expandSpy = expandOccurrences as unknown as Mock;

const NOW = new Date('2026-10-23T08:00:00.000Z');

const weekly = (
  overrides: Partial<ScheduleForm['weekly']> = {}
): ScheduleForm => ({
  ...emptyScheduleForm(),
  scheduleType: EventScheduleType.Weekly,
  weekly: {
    dateFrom: '2028-04-01',
    timeFrom: '20:00',
    dateTo: '2028-06-30',
    timeTo: '22:00',
    openingTime: '',
    weekDays: [4, 5, 6, 7],
    ...overrides,
  },
});

const continuousUntil = (dateTo: string, timeTo: string): ScheduleForm => ({
  ...emptyScheduleForm(),
  scheduleType: EventScheduleType.Continuous,
  continuous: {
    dateFrom: '2028-10-01',
    timeFrom: '10:00',
    dateTo,
    timeTo,
    openingTime: '',
  },
});

beforeEach(() => {
  expandSpy.mockClear();
});

describe('previewOccurrences', () => {
  it('counts a Thursday-to-Sunday series over a quarter and repeats its times', () => {
    expect(previewOccurrences(weekly(), NOW)).toEqual({
      problems: [],
      count: 52,
      timeFrom: '20:00',
      timeTo: '22:00',
    });
  });

  it('reports MissingWeekDays for a weekly series with no day and never expands it', () => {
    expect(previewOccurrences(weekly({ weekDays: [] }), NOW)).toEqual({
      problems: ['MissingWeekDays'],
      count: null,
    });
    expect(expandSpy).not.toHaveBeenCalled();
  });

  it('reports InvalidWeekDays for weekday 8 and never expands it', () => {
    expect(
      previewOccurrences(weekly({ weekDays: [4, 8] }), NOW).problems
    ).toEqual(['InvalidWeekDays']);
    expect(expandSpy).not.toHaveBeenCalled();
  });

  it('reports BeyondScheduleHorizon for a last date past the last schedulable day and never expands it', () => {
    expect(
      previewOccurrences(weekly({ dateTo: '2028-11-30' }), NOW).problems
    ).toEqual(['BeyondScheduleHorizon']);
    expect(expandSpy).not.toHaveBeenCalled();
  });

  it('accepts 23:59 on the horizon day', () => {
    expect(
      previewOccurrences(continuousUntil('2028-10-23', '23:59'), NOW)
    ).toMatchObject({ problems: [], count: 1 });
  });

  it('refuses 00:00 on the day after the horizon day', () => {
    expect(
      previewOccurrences(continuousUntil('2028-10-24', '00:00'), NOW).problems
    ).toEqual(['BeyondScheduleHorizon']);
  });

  it('reports IncompleteDates for an explicit row without a time and never expands it', () => {
    const form: ScheduleForm = {
      ...emptyScheduleForm(),
      scheduleType: EventScheduleType.Explicit,
      explicit: [
        {
          id: 'a',
          value: {
            date: '2028-05-12',
            timeFrom: '',
            timeTo: '22:00',
            openingTime: '',
          },
        },
      ],
    };

    expect(previewOccurrences(form, NOW).problems).toEqual(['IncompleteDates']);
    expect(expandSpy).not.toHaveBeenCalled();
  });

  it('refuses to expand a weekly span that starts in a year still being typed', () => {
    expect(
      previewOccurrences(weekly({ dateFrom: '1202-04-01' }), NOW).problems
    ).toEqual(['SpanTooLongToPreview']);
    expect(expandSpy).not.toHaveBeenCalled();
  });

  it('counts explicit dates without repeating a time', () => {
    const form: ScheduleForm = {
      ...emptyScheduleForm(),
      scheduleType: EventScheduleType.Explicit,
      explicit: ['2028-05-12', '2028-05-13'].map(date => ({
        id: date,
        value: { date, timeFrom: '20:00', timeTo: '22:00', openingTime: '' },
      })),
    };

    expect(previewOccurrences(form, NOW)).toEqual({
      problems: [],
      count: 2,
    });
  });
});
