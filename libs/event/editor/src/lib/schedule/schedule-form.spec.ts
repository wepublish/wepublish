import { EventScheduleType } from '@wepublish/editor/api';

import {
  duplicateExplicitDate,
  emptyScheduleForm,
  ScheduleForm,
  scheduleFormFromEvent,
  scheduleFromForm,
  scheduleInputFromForm,
} from './schedule-form';

const span = (overrides: Partial<ScheduleForm['continuous']> = {}) => ({
  dateFrom: '2028-03-09',
  timeFrom: '20:00',
  dateTo: '2028-03-09',
  timeTo: '22:00',
  openingTime: '',
  ...overrides,
});

const form = (overrides: Partial<ScheduleForm> = {}): ScheduleForm => ({
  ...emptyScheduleForm(),
  ...overrides,
});

describe('schedule form', () => {
  it('turns 20:00 on 2028-03-09 in Zurich into 19:00Z in winter time', () => {
    const input = scheduleInputFromForm(
      form({
        scheduleType: EventScheduleType.Continuous,
        continuous: span(),
      })
    );

    expect(input.dateFrom).toBe('2028-03-09T19:00:00.000Z');
    expect(input.dateTo).toBe('2028-03-09T21:00:00.000Z');
  });

  it('turns 20:00 into 18:00Z in summer time', () => {
    const input = scheduleInputFromForm(
      form({
        scheduleType: EventScheduleType.Continuous,
        continuous: span({ dateFrom: '2028-07-09', dateTo: '2028-07-09' }),
      })
    );

    expect(input.dateFrom).toBe('2028-07-09T18:00:00.000Z');
  });

  it('keeps a weekly To time earlier than its From time as typed, so expansion runs it overnight', () => {
    const input = scheduleInputFromForm(
      form({
        scheduleType: EventScheduleType.Weekly,
        weekly: {
          ...span({
            dateFrom: '2028-04-01',
            timeFrom: '22:00',
            dateTo: '2028-06-30',
            timeTo: '04:00',
          }),
          weekDays: [5, 6],
        },
      })
    );

    expect(input).toMatchObject({
      scheduleType: EventScheduleType.Weekly,
      dateFrom: '2028-04-01T20:00:00.000Z',
      dateTo: '2028-06-30T02:00:00.000Z',
      weekDays: [5, 6],
      dates: [],
    });
  });

  it('keeps explicit rows in their order and turns them into dates', () => {
    const input = scheduleInputFromForm(
      form({
        scheduleType: EventScheduleType.Explicit,
        explicit: [
          {
            id: 'b',
            value: {
              date: '2028-05-13',
              timeFrom: '20:00',
              timeTo: '22:00',
              openingTime: '19:00',
            },
          },
          {
            id: 'a',
            value: {
              date: '2028-05-12',
              timeFrom: '20:00',
              timeTo: '22:00',
              openingTime: '',
            },
          },
        ],
      })
    );

    expect(input).toMatchObject({
      scheduleType: EventScheduleType.Explicit,
      dateFrom: null,
      dateTo: null,
      weekDays: [],
      dates: [
        {
          dateFrom: '2028-05-13T18:00:00.000Z',
          dateTo: '2028-05-13T20:00:00.000Z',
          openingTime: '19:00',
        },
        {
          dateFrom: '2028-05-12T18:00:00.000Z',
          dateTo: '2028-05-12T20:00:00.000Z',
          openingTime: null,
        },
      ],
    });
  });

  it('ends an explicit row on the next day when its To time is earlier than its From time', () => {
    const input = scheduleInputFromForm(
      form({
        scheduleType: EventScheduleType.Explicit,
        explicit: [
          {
            id: 'a',
            value: {
              date: '2028-05-12',
              timeFrom: '22:00',
              timeTo: '01:00',
              openingTime: '',
            },
          },
        ],
      })
    );

    expect(input.dates).toEqual([
      {
        dateFrom: '2028-05-12T20:00:00.000Z',
        dateTo: '2028-05-12T23:00:00.000Z',
        openingTime: null,
      },
    ]);
  });

  it('marks the schedule incomplete when an explicit row lacks a date or a time', () => {
    const { schedule, incomplete } = scheduleFromForm(
      form({
        scheduleType: EventScheduleType.Explicit,
        explicit: [
          {
            id: 'a',
            value: {
              date: '',
              timeFrom: '20:00',
              timeTo: '22:00',
              openingTime: '',
            },
          },
        ],
      })
    );

    expect(incomplete).toBe(true);
    expect(schedule.dates).toEqual([]);
  });

  it('leaves the range open when a date or time of a span is missing or malformed', () => {
    const { schedule } = scheduleFromForm(
      form({
        scheduleType: EventScheduleType.Continuous,
        continuous: span({ timeFrom: '25:00', dateTo: '' }),
      })
    );

    expect(schedule.dateFrom).toBeNull();
    expect(schedule.dateTo).toBeNull();
  });

  it('keeps each mode’s values when the mode changes', () => {
    const weekly = { ...span(), weekDays: [4, 5, 6, 7] };
    const switched = form({
      scheduleType: EventScheduleType.Continuous,
      weekly,
    });

    expect(scheduleInputFromForm(switched).weekDays).toEqual([]);
    expect(
      scheduleInputFromForm({
        ...switched,
        scheduleType: EventScheduleType.Weekly,
      }).weekDays
    ).toEqual([4, 5, 6, 7]);
  });

  it('reads a stored event back into Zurich wall-clock values for its mode', () => {
    const values = scheduleFormFromEvent({
      scheduleType: EventScheduleType.Weekly,
      dateFrom: '2028-04-01T18:00:00.000Z',
      dateTo: '2028-06-30T20:00:00.000Z',
      weekDays: [4, 5, 6, 7],
      openingTime: '19:30',
      dates: [],
    });

    expect(values.scheduleType).toBe(EventScheduleType.Weekly);
    expect(values.weekly).toEqual({
      dateFrom: '2028-04-01',
      timeFrom: '20:00',
      dateTo: '2028-06-30',
      timeTo: '22:00',
      openingTime: '19:30',
      weekDays: [4, 5, 6, 7],
    });
  });

  it('reads stored explicit dates back as rows, the overnight one included', () => {
    const values = scheduleFormFromEvent({
      scheduleType: EventScheduleType.Explicit,
      dateFrom: null,
      dateTo: null,
      weekDays: [],
      openingTime: null,
      dates: [
        {
          dateFrom: '2028-05-12T20:00:00.000Z',
          dateTo: '2028-05-12T23:00:00.000Z',
          openingTime: null,
        },
      ],
    });

    expect(values.explicit.map(({ value }) => value)).toEqual([
      {
        date: '2028-05-12',
        timeFrom: '22:00',
        timeTo: '01:00',
        openingTime: '',
      },
    ]);
  });

  it('duplicates an explicit row onto the following day with the same times', () => {
    expect(
      duplicateExplicitDate({
        date: '2028-02-28',
        timeFrom: '20:00',
        timeTo: '23:30',
        openingTime: '19:00',
      })
    ).toEqual({
      date: '2028-02-29',
      timeFrom: '20:00',
      timeTo: '23:30',
      openingTime: '19:00',
    });
  });

  it('duplicates a row without a date as it is', () => {
    const row = { date: '', timeFrom: '20:00', timeTo: '', openingTime: '' };

    expect(duplicateExplicitDate(row)).toEqual(row);
  });
});
