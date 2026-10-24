import { EventSchedule } from './event-schedule';
import { isWithinScheduleHorizon } from './schedule-horizon';

export type ScheduleInputError =
  'MissingWeekDays' | 'InvalidWeekDays' | 'BeyondScheduleHorizon';

const isIsoWeekday = (value: number) =>
  Number.isInteger(value) && value >= 1 && value <= 7;

export const hasRequiredWeekDays = (schedule: EventSchedule): boolean =>
  schedule.scheduleType !== 'Weekly' || schedule.weekDays.length > 0;

export const hasValidWeekDays = (schedule: EventSchedule): boolean =>
  schedule.weekDays.every(isIsoWeekday) &&
  new Set(schedule.weekDays).size === schedule.weekDays.length;

export const validateScheduleInput = (
  schedule: EventSchedule,
  now: Date
): ScheduleInputError[] => [
  ...(hasRequiredWeekDays(schedule) ? [] : ['MissingWeekDays' as const]),
  ...(hasValidWeekDays(schedule) ? [] : ['InvalidWeekDays' as const]),
  ...(isWithinScheduleHorizon(schedule, now) ?
    []
  : ['BeyondScheduleHorizon' as const]),
];
