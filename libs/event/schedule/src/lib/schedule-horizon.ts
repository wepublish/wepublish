import { EventSchedule } from './event-schedule';
import {
  addCalendarDays,
  instantToZurichWallClock,
  zurichWallClockToInstant,
} from './zurich-time';

export const SCHEDULE_HORIZON_YEARS = 2;

export type ZurichCalendarDay = {
  year: number;
  month: number;
  day: number;
};

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const lastSchedulableDay = (now: Date): ZurichCalendarDay => {
  const today = instantToZurichWallClock(now);
  const year = today.year + SCHEDULE_HORIZON_YEARS;
  const day =
    today.month === 2 && today.day === 29 && !isLeapYear(year) ? 28 : today.day;

  return { year, month: today.month, day };
};

export const scheduleHorizon = (now: Date): Date => {
  const nextMidnight = addCalendarDays(
    {
      ...lastSchedulableDay(now),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    1
  );

  return new Date(zurichWallClockToInstant(nextMidnight).getTime() - 1);
};

export const lastScheduledDate = (schedule: EventSchedule): Date | null => {
  if (schedule.scheduleType !== 'Explicit') {
    return schedule.dateTo && new Date(schedule.dateTo.getTime());
  }

  if (schedule.dates.length === 0) {
    return null;
  }

  return new Date(
    schedule.dates.reduce(
      (latest, { dateTo }) => Math.max(latest, dateTo.getTime()),
      -Infinity
    )
  );
};

export const isWithinScheduleHorizon = (
  schedule: EventSchedule,
  now: Date
): boolean => {
  const last = lastScheduledDate(schedule);

  return !last || last.getTime() <= scheduleHorizon(now).getTime();
};
