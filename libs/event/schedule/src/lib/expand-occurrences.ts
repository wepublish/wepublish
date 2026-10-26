import {
  EventSchedule,
  EventScheduleDate,
  ExpandedOccurrence,
} from './event-schedule';
import {
  addCalendarDays,
  instantToZurichWallClock,
  isoWeekday,
  ZurichWallClock,
  zurichWallClockToInstant,
} from './zurich-time';

const requireSpan = (schedule: EventSchedule) => {
  if (!schedule.dateFrom || !schedule.dateTo) {
    throw new Error(
      `A ${schedule.scheduleType} schedule needs both dateFrom and dateTo`
    );
  }

  return { dateFrom: schedule.dateFrom, dateTo: schedule.dateTo };
};

const minutesOfDay = (wallClock: ZurichWallClock) =>
  wallClock.hour * 60 + wallClock.minute;

const compareDates = (a: EventScheduleDate, b: EventScheduleDate) =>
  a.dateFrom.getTime() - b.dateFrom.getTime() ||
  a.dateTo.getTime() - b.dateTo.getTime() ||
  a.sortOrder - b.sortOrder;

const expandContinuous = (schedule: EventSchedule): ExpandedOccurrence[] => {
  const { dateFrom, dateTo } = requireSpan(schedule);

  return [
    {
      dateFrom: new Date(dateFrom.getTime()),
      dateTo: new Date(dateTo.getTime()),
      openingTime: schedule.openingTime,
      legacyEventId: null,
    },
  ];
};

const expandExplicit = (schedule: EventSchedule): ExpandedOccurrence[] =>
  [...schedule.dates].sort(compareDates).map(date => ({
    dateFrom: new Date(date.dateFrom.getTime()),
    dateTo: new Date(date.dateTo.getTime()),
    openingTime: date.openingTime,
    legacyEventId: date.legacyEventId,
  }));

const expandWeekly = (schedule: EventSchedule): ExpandedOccurrence[] => {
  const { dateFrom, dateTo } = requireSpan(schedule);
  const weekDays = new Set(schedule.weekDays);
  const occurrences: ExpandedOccurrence[] = [];

  if (weekDays.size === 0) {
    return occurrences;
  }

  const end = instantToZurichWallClock(dateTo);
  const overnight =
    minutesOfDay(instantToZurichWallClock(dateFrom)) > minutesOfDay(end);

  let current = new Date(dateFrom.getTime());
  let wallClock = instantToZurichWallClock(current);

  while (current.getTime() < dateTo.getTime()) {
    if (weekDays.has(isoWeekday(wallClock))) {
      const endDay = overnight ? addCalendarDays(wallClock, 1) : wallClock;
      const endReference =
        overnight ? zurichWallClockToInstant(endDay, current) : current;

      occurrences.push({
        dateFrom: new Date(current.getTime()),
        dateTo: zurichWallClockToInstant(
          {
            ...endDay,
            hour: end.hour,
            minute: end.minute,
            second: 0,
            millisecond: 0,
          },
          endReference
        ),
        openingTime: schedule.openingTime,
        legacyEventId: null,
      });
    }

    current = zurichWallClockToInstant(addCalendarDays(wallClock, 1), current);
    wallClock = instantToZurichWallClock(current);
  }

  return occurrences;
};

export const expandOccurrences = (
  schedule: EventSchedule
): ExpandedOccurrence[] => {
  switch (schedule.scheduleType) {
    case 'Continuous':
      return expandContinuous(schedule);
    case 'Weekly':
      return expandWeekly(schedule);
    case 'Explicit':
      return expandExplicit(schedule);
    default: {
      const unknownType: never = schedule.scheduleType;

      throw new Error(`Unknown schedule type ${String(unknownType)}`);
    }
  }
};
