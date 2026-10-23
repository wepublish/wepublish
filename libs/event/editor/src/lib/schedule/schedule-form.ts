import { EventScheduleType } from '@wepublish/editor/api';
import {
  addCalendarDays,
  EventSchedule,
  EventScheduleDate,
  instantToZurichWallClock,
  isOpeningTime,
  zurichWallClockToInstant,
} from '@wepublish/event/schedule';
import { ListValue } from '@wepublish/ui/editor';
import nanoid from 'nanoid';

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const DEFAULT_TIME_FROM = '20:00';
export const DEFAULT_TIME_TO = '23:30';

export type ScheduleSpanForm = {
  dateFrom: string;
  timeFrom: string;
  dateTo: string;
  timeTo: string;
  openingTime: string;
};

export type WeeklyScheduleForm = ScheduleSpanForm & { weekDays: number[] };

export type ExplicitDateForm = {
  date: string;
  timeFrom: string;
  timeTo: string;
  openingTime: string;
};

export type ScheduleForm = {
  scheduleType: EventScheduleType;
  continuous: ScheduleSpanForm;
  weekly: WeeklyScheduleForm;
  explicit: ListValue<ExplicitDateForm>[];
};

export type ScheduleSource = {
  scheduleType: EventScheduleType;
  dateFrom?: string | null;
  dateTo?: string | null;
  weekDays: number[];
  openingTime?: string | null;
  dates: { dateFrom: string; dateTo: string; openingTime?: string | null }[];
};

export type ScheduleInputValues = {
  scheduleType: EventScheduleType;
  dateFrom: string | null;
  dateTo: string | null;
  weekDays: number[];
  openingTime: string | null;
  dates: { dateFrom: string; dateTo: string; openingTime: string | null }[];
};

type CalendarDay = { year: number; month: number; day: number };
type TimeOfDay = { hour: number; minute: number };

const MIN_YEAR = 1000;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const parseDay = (value: string): CalendarDay | null => {
  const match = DAY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
      year >= MIN_YEAR &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    ) ?
      { year, month, day }
    : null;
};

const parseTime = (value: string): TimeOfDay | null => {
  if (!isOpeningTime(value)) {
    return null;
  }

  const [hour, minute] = value.split(':').map(Number);

  return { hour, minute };
};

const minutesOf = ({ hour, minute }: TimeOfDay) => hour * 60 + minute;

const toInstant = (day: CalendarDay, time: TimeOfDay) =>
  zurichWallClockToInstant({
    ...day,
    ...time,
    second: 0,
    millisecond: 0,
  });

const instantOf = (date: string, time: string): Date | null => {
  const day = parseDay(date);
  const timeOfDay = parseTime(time);

  return day && timeOfDay ? toInstant(day, timeOfDay) : null;
};

const formatDay = ({ year, month, day }: CalendarDay) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

const wallClockOf = (iso: string | null | undefined) => {
  if (!iso) {
    return { date: '', time: '' };
  }

  const wallClock = instantToZurichWallClock(new Date(iso));

  return {
    date: formatDay(wallClock),
    time: `${pad(wallClock.hour)}:${pad(wallClock.minute)}`,
  };
};

const optional = (value: string) => (value.trim() ? value.trim() : null);

export const emptySpanForm = (): ScheduleSpanForm => ({
  dateFrom: '',
  timeFrom: DEFAULT_TIME_FROM,
  dateTo: '',
  timeTo: DEFAULT_TIME_TO,
  openingTime: '',
});

export const emptyExplicitDate = (): ExplicitDateForm => ({
  date: '',
  timeFrom: DEFAULT_TIME_FROM,
  timeTo: DEFAULT_TIME_TO,
  openingTime: '',
});

export const emptyScheduleForm = (): ScheduleForm => ({
  scheduleType: EventScheduleType.Continuous,
  continuous: emptySpanForm(),
  weekly: { ...emptySpanForm(), weekDays: [] },
  explicit: [{ id: nanoid(), value: emptyExplicitDate() }],
});

export const duplicateExplicitDate = (
  row: ExplicitDateForm
): ExplicitDateForm => {
  const day = parseDay(row.date);

  if (!day) {
    return { ...row };
  }

  return {
    ...row,
    date: formatDay(
      addCalendarDays(
        { ...day, hour: 12, minute: 0, second: 0, millisecond: 0 },
        1
      )
    ),
  };
};

const spanFormOf = (source: ScheduleSource): ScheduleSpanForm => {
  const from = wallClockOf(source.dateFrom);
  const to = wallClockOf(source.dateTo);

  return {
    dateFrom: from.date,
    timeFrom: from.time,
    dateTo: to.date,
    timeTo: to.time,
    openingTime: source.openingTime ?? '',
  };
};

export const scheduleFormFromEvent = (source: ScheduleSource): ScheduleForm => {
  const empty = emptyScheduleForm();

  switch (source.scheduleType) {
    case EventScheduleType.Weekly:
      return {
        ...empty,
        scheduleType: source.scheduleType,
        weekly: { ...spanFormOf(source), weekDays: [...source.weekDays] },
      };
    case EventScheduleType.Explicit:
      return {
        ...empty,
        scheduleType: source.scheduleType,
        explicit: source.dates.map(date => {
          const from = wallClockOf(date.dateFrom);
          const to = wallClockOf(date.dateTo);

          return {
            id: nanoid(),
            value: {
              date: from.date,
              timeFrom: from.time,
              timeTo: to.time,
              openingTime: date.openingTime ?? '',
            },
          };
        }),
      };
    default:
      return {
        ...empty,
        scheduleType: source.scheduleType,
        continuous: spanFormOf(source),
      };
  }
};

const explicitDateOf = (
  row: ExplicitDateForm,
  sortOrder: number
): EventScheduleDate | null => {
  const day = parseDay(row.date);
  const from = parseTime(row.timeFrom);
  const to = parseTime(row.timeTo);

  if (!day || !from || !to) {
    return null;
  }

  const endDay =
    minutesOf(to) < minutesOf(from) ?
      addCalendarDays({ ...day, ...from, second: 0, millisecond: 0 }, 1)
    : day;

  return {
    dateFrom: toInstant(day, from),
    dateTo: toInstant(
      { year: endDay.year, month: endDay.month, day: endDay.day },
      to
    ),
    openingTime: optional(row.openingTime),
    sortOrder,
    legacyEventId: null,
  };
};

const activeSpan = (form: ScheduleForm): ScheduleSpanForm | null => {
  switch (form.scheduleType) {
    case EventScheduleType.Weekly:
      return form.weekly;
    case EventScheduleType.Continuous:
      return form.continuous;
    default:
      return null;
  }
};

export const scheduleFromForm = (
  form: ScheduleForm
): { schedule: EventSchedule; incomplete: boolean } => {
  const scheduleType = form.scheduleType as `${EventScheduleType}`;
  const span = activeSpan(form);

  if (!span) {
    const dates = form.explicit.map(({ value }, index) =>
      explicitDateOf(value, index)
    );
    const complete = dates.filter(
      (date): date is EventScheduleDate => date !== null
    );

    return {
      schedule: {
        scheduleType,
        dateFrom: null,
        dateTo: null,
        weekDays: [],
        openingTime: null,
        dates: complete,
      },
      incomplete: complete.length !== dates.length,
    };
  }

  return {
    schedule: {
      scheduleType,
      dateFrom: instantOf(span.dateFrom, span.timeFrom),
      dateTo: instantOf(span.dateTo, span.timeTo),
      weekDays:
        form.scheduleType === EventScheduleType.Weekly ?
          form.weekly.weekDays
        : [],
      openingTime: optional(span.openingTime),
      dates: [],
    },
    incomplete: false,
  };
};

export const scheduleInputFromForm = (
  form: ScheduleForm
): ScheduleInputValues => {
  const { schedule } = scheduleFromForm(form);

  return {
    scheduleType: form.scheduleType,
    dateFrom: schedule.dateFrom?.toISOString() ?? null,
    dateTo: schedule.dateTo?.toISOString() ?? null,
    weekDays: [...schedule.weekDays],
    openingTime: schedule.openingTime,
    dates: schedule.dates.map(({ dateFrom, dateTo, openingTime }) => ({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      openingTime,
    })),
  };
};
