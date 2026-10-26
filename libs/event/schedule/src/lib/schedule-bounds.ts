import { EventSchedule } from './event-schedule';

export type ScheduleBounds = {
  firstDateAt: Date | null;
  lastDateAt: Date | null;
};

const copy = (date: Date | null) => date && new Date(date.getTime());

export const scheduleBounds = (schedule: EventSchedule): ScheduleBounds => {
  if (schedule.scheduleType !== 'Explicit') {
    return {
      firstDateAt: copy(schedule.dateFrom),
      lastDateAt: copy(schedule.dateTo),
    };
  }

  if (schedule.dates.length === 0) {
    return { firstDateAt: null, lastDateAt: null };
  }

  return {
    firstDateAt: new Date(
      schedule.dates.reduce(
        (earliest, { dateFrom }) => Math.min(earliest, dateFrom.getTime()),
        Infinity
      )
    ),
    lastDateAt: new Date(
      schedule.dates.reduce(
        (latest, { dateTo }) => Math.max(latest, dateTo.getTime()),
        -Infinity
      )
    ),
  };
};
