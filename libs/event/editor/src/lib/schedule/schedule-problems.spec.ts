import { EventScheduleType } from '@wepublish/editor/api';

import { describeScheduleProblem } from './schedule-problems';

const NOW = new Date('2026-10-23T08:00:00.000Z');

describe('describeScheduleProblem', () => {
  it('puts MissingWeekDays at the day toggles', () => {
    expect(
      describeScheduleProblem(
        'MissingWeekDays',
        EventScheduleType.Weekly,
        NOW,
        'en'
      )
    ).toEqual({
      field: 'weekly.weekDays',
      key: 'agenda.schedule.problems.MissingWeekDays',
      values: {},
    });
  });

  it('puts BeyondScheduleHorizon at the end date with the last schedulable day and no time', () => {
    expect(
      describeScheduleProblem(
        'BeyondScheduleHorizon',
        EventScheduleType.Continuous,
        NOW,
        'en'
      )
    ).toEqual({
      field: 'continuous.dateTo',
      key: 'agenda.schedule.problems.BeyondScheduleHorizon',
      values: { date: '23 October 2028' },
    });
  });

  it('formats the last schedulable day in the editor language', () => {
    expect(
      describeScheduleProblem(
        'BeyondScheduleHorizon',
        EventScheduleType.Weekly,
        NOW,
        'de'
      ).values
    ).toEqual({ date: '23. Oktober 2028' });
  });

  it('puts problems of explicit dates under the date list', () => {
    expect(
      describeScheduleProblem(
        'DateToBeforeDateFrom',
        EventScheduleType.Explicit,
        NOW,
        'en'
      ).field
    ).toBe('explicit');
  });

  it('puts a malformed door time at the door time of the mode', () => {
    expect(
      describeScheduleProblem(
        'InvalidOpeningTime',
        EventScheduleType.Weekly,
        NOW,
        'en'
      ).field
    ).toBe('weekly.openingTime');
  });

  it('puts a missing range at the start date', () => {
    expect(
      describeScheduleProblem(
        'MissingDateRange',
        EventScheduleType.Continuous,
        NOW,
        'en'
      ).field
    ).toBe('continuous.dateFrom');
  });
});
