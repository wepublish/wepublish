import { EventScheduleType } from '@wepublish/editor/api';
import {
  EventSchedule,
  EventScheduleProblem,
  eventScheduleProblems,
  expandOccurrences,
} from '@wepublish/event/schedule';

import { ScheduleForm, scheduleFromForm } from './schedule-form';

export type SchedulePreviewProblem =
  EventScheduleProblem | 'IncompleteDates' | 'SpanTooLongToPreview';

export type OccurrencePreview = {
  problems: SchedulePreviewProblem[];
  count: number | null;
  timeFrom?: string;
  timeTo?: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PREVIEW_MAX_SPAN_DAYS = 10 * 366;

const spanDays = ({ dateFrom, dateTo }: EventSchedule) =>
  dateFrom && dateTo ? (dateTo.getTime() - dateFrom.getTime()) / DAY_IN_MS : 0;

export const previewOccurrences = (
  form: ScheduleForm,
  now: Date
): OccurrencePreview => {
  const { schedule, incomplete } = scheduleFromForm(form);

  if (incomplete) {
    return { problems: ['IncompleteDates'], count: null };
  }

  const problems = eventScheduleProblems(schedule, now);

  if (problems.length) {
    return { problems, count: null };
  }

  if (spanDays(schedule) > PREVIEW_MAX_SPAN_DAYS) {
    return { problems: ['SpanTooLongToPreview'], count: null };
  }

  const count = expandOccurrences(schedule).length;

  if (form.scheduleType === EventScheduleType.Weekly) {
    return {
      problems: [],
      count,
      timeFrom: form.weekly.timeFrom,
      timeTo: form.weekly.timeTo,
    };
  }

  return { problems: [], count };
};
