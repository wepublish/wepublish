import { EventScheduleType } from '@wepublish/editor/api';
import { lastSchedulableDay } from '@wepublish/event/schedule';

import { formatCalendarDay } from '../event-list/event-format';
import { SchedulePreviewProblem } from './occurrence-preview';

export type ScheduleProblemMessage = {
  field: string;
  key: string;
  values: Record<string, string>;
};

const SPAN_FIELD_OF: Partial<Record<SchedulePreviewProblem, string>> = {
  MissingWeekDays: 'weekDays',
  InvalidWeekDays: 'weekDays',
  InvalidOpeningTime: 'openingTime',
  DateToBeforeDateFrom: 'dateTo',
  BeyondScheduleHorizon: 'dateTo',
};

export const scheduleProblemPath = (
  problem: SchedulePreviewProblem,
  scheduleType: EventScheduleType
): string[] => {
  switch (scheduleType) {
    case EventScheduleType.Explicit:
      return ['explicit'];
    case EventScheduleType.Weekly:
      return ['weekly', SPAN_FIELD_OF[problem] ?? 'dateFrom'];
    default:
      return ['continuous', SPAN_FIELD_OF[problem] ?? 'dateFrom'];
  }
};

export const scheduleProblemKey = (problem: SchedulePreviewProblem) =>
  `agenda.schedule.problems.${problem}`;

export const describeScheduleProblem = (
  problem: SchedulePreviewProblem,
  scheduleType: EventScheduleType,
  now: Date,
  language: string
): ScheduleProblemMessage => ({
  field: scheduleProblemPath(problem, scheduleType).join('.'),
  key: scheduleProblemKey(problem),
  values:
    problem === 'BeyondScheduleHorizon' ?
      { date: formatCalendarDay(lastSchedulableDay(now), language) }
    : {},
});
