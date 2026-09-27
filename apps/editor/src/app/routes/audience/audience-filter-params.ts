import type { DailySubscriptionStats } from '@wepublish/editor/api';
import type { DateRange } from 'rsuite/esm/DateRangePicker';

export type TimeResolution = 'daily' | 'monthly';

export interface AudienceApiFilter {
  dateRange?: DateRange | null;
  memberPlanIds?: string[];
}

export type AudienceClientFilter = Pick<
  {
    [K in keyof DailySubscriptionStats]: boolean;
  },
  | 'totalActiveSubscriptionCount'
  | 'createdSubscriptionCount'
  | 'overdueSubscriptionCount'
  | 'deactivatedSubscriptionCount'
  | 'renewedSubscriptionCount'
  | 'replacedSubscriptionCount'
  | 'predictedSubscriptionRenewalCount'
  | 'endingSubscriptionCount'
>;

export interface AudienceComponentFilter {
  filter: boolean;
  chart: boolean;
  table: boolean;
}

export const DEFAULT_AUDIENCE_CLIENT_FILTER: AudienceClientFilter = {
  totalActiveSubscriptionCount: false,
  createdSubscriptionCount: true,
  overdueSubscriptionCount: true,
  deactivatedSubscriptionCount: true,
  renewedSubscriptionCount: true,
  replacedSubscriptionCount: true,
  predictedSubscriptionRenewalCount: false,
  endingSubscriptionCount: false,
};

export const DEFAULT_AUDIENCE_COMPONENT_FILTER: AudienceComponentFilter = {
  chart: true,
  table: false,
  filter: true,
};

export interface AudienceFilterState {
  resolution: TimeResolution;
  dateRange: DateRange | null;
  memberPlanIds: string[];
  clientFilter: AudienceClientFilter;
  componentFilter: AudienceComponentFilter;
}

export interface PreDefinedDates {
  today: Date;
  lastWeek: Date;
  lastMonth: Date;
  lastQuarter: Date;
  lastYear: Date;
  nextWeek: Date;
  nextMonth: Date;
  nextQuarter: Date;
  nextYear: Date;
}

const atMidnight = (date: Date) =>
  new Date(new Date(date).setHours(0, 0, 0, 0));

const addDays = (date: Date, days: number) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const addMonths = (date: Date, months: number) => {
  const shifted = new Date(date);
  shifted.setMonth(shifted.getMonth() + months);
  return shifted;
};

const addYears = (date: Date, years: number) => {
  const shifted = new Date(date);
  shifted.setFullYear(shifted.getFullYear() + years);
  return shifted;
};

export function preDefinedDates(from: Date = new Date()): PreDefinedDates {
  const today = atMidnight(from);

  return {
    today,
    lastWeek: addDays(today, -7),
    lastMonth: addMonths(today, -1),
    lastQuarter: addMonths(today, -3),
    lastYear: addYears(today, -1),
    nextWeek: addDays(today, 7),
    nextMonth: addMonths(today, 1),
    nextQuarter: addMonths(today, 3),
    nextYear: addYears(today, 1),
  };
}

export type DateRangePresetKey = Exclude<keyof PreDefinedDates, 'today'>;

const DATE_RANGE_PRESET_KEYS: DateRangePresetKey[] = [
  'lastWeek',
  'lastMonth',
  'lastQuarter',
  'lastYear',
  'nextWeek',
  'nextMonth',
  'nextQuarter',
  'nextYear',
];

export const AUDIENCE_FILTER_PARAM_KEYS = [
  'resolution',
  'range',
  'from',
  'to',
  'plans',
  'metrics',
  'show',
] as const;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatDay = (date: Date) =>
  [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-');

const parseDay = (value: string | null): Date | null => {
  if (!value || !DAY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, dayOfMonth] = value.split('-').map(Number);
  const date = new Date(year, month - 1, dayOfMonth);

  const parsed =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === dayOfMonth;

  return parsed ? date : null;
};

const isSameDay = (one: Date, other: Date) =>
  formatDay(one) === formatDay(other);

const isDateRangePresetKey = (value: string): value is DateRangePresetKey =>
  (DATE_RANGE_PRESET_KEYS as string[]).includes(value);

const presetRange = (
  key: DateRangePresetKey,
  dates: PreDefinedDates
): DateRange =>
  key.startsWith('last') ?
    [dates[key], dates.today]
  : [dates.today, dates[key]];

export function dateRangeForPreset(
  key: DateRangePresetKey,
  now?: Date
): DateRange {
  return presetRange(key, preDefinedDates(now));
}

export function hasAudienceFilterParams(params: URLSearchParams): boolean {
  return AUDIENCE_FILTER_PARAM_KEYS.some(key => params.has(key));
}

export function matchDateRangePreset(
  dateRange: DateRange,
  now?: Date
): DateRangePresetKey | null {
  const dates = preDefinedDates(now);

  return (
    DATE_RANGE_PRESET_KEYS.find(key => {
      const [start, end] = presetRange(key, dates);
      return isSameDay(start, dateRange[0]) && isSameDay(end, dateRange[1]);
    }) ?? null
  );
}

export interface EncodeAudienceFilterOptions {
  absoluteDates?: boolean;
  now?: Date;
}

export function encodeAudienceFilter(
  state: AudienceFilterState,
  { absoluteDates = false, now }: EncodeAudienceFilterOptions = {}
): URLSearchParams {
  const params = new URLSearchParams();

  params.set('resolution', state.resolution);

  const preset =
    state.dateRange && !absoluteDates ?
      matchDateRangePreset(state.dateRange, now)
    : null;

  if (preset) {
    params.set('range', preset);
  } else if (state.dateRange) {
    params.set('from', formatDay(state.dateRange[0]));
    params.set('to', formatDay(state.dateRange[1]));
  }

  if (state.memberPlanIds.length) {
    params.set('plans', state.memberPlanIds.join(','));
  }

  params.set(
    'metrics',
    Object.entries(state.clientFilter)
      .filter(([, enabled]) => enabled)
      .map(([metric]) => metric)
      .join(',')
  );

  params.set(
    'show',
    (['chart', 'table'] as const)
      .filter(component => state.componentFilter[component])
      .join(',')
  );

  return params;
}

const decodeList = (raw: string | null, fallback: string[]) =>
  raw === null ? fallback : raw.split(',').filter(Boolean);

const decodeDateRange = (
  params: URLSearchParams,
  fallback: DateRange | null,
  now?: Date
): DateRange | null => {
  const range = params.get('range');

  if (range && isDateRangePresetKey(range)) {
    return presetRange(range, preDefinedDates(now));
  }

  const from = parseDay(params.get('from'));
  const to = parseDay(params.get('to'));

  if (from && to) {
    return from <= to ? [from, to] : [to, from];
  }

  return fallback;
};

const decodeClientFilter = (
  params: URLSearchParams,
  fallback: AudienceClientFilter
): AudienceClientFilter => {
  const raw = params.get('metrics');

  if (raw === null) {
    return fallback;
  }

  const enabled = new Set(raw.split(',').filter(Boolean));

  return Object.fromEntries(
    Object.keys(fallback).map(metric => [metric, enabled.has(metric)])
  ) as AudienceClientFilter;
};

const decodeComponentFilter = (
  params: URLSearchParams,
  fallback: AudienceComponentFilter
): AudienceComponentFilter => {
  const raw = params.get('show');

  if (raw === null) {
    return fallback;
  }

  const visible = new Set(raw.split(',').filter(Boolean));

  return {
    ...fallback,
    chart: visible.has('chart'),
    table: visible.has('table'),
  };
};

export function decodeAudienceFilter(
  params: URLSearchParams,
  fallback: AudienceFilterState,
  now?: Date
): AudienceFilterState {
  const resolution = params.get('resolution');

  return {
    resolution:
      resolution === 'daily' || resolution === 'monthly' ?
        resolution
      : fallback.resolution,
    dateRange: decodeDateRange(params, fallback.dateRange, now),
    memberPlanIds: decodeList(params.get('plans'), fallback.memberPlanIds),
    clientFilter: decodeClientFilter(params, fallback.clientFilter),
    componentFilter: decodeComponentFilter(params, fallback.componentFilter),
  };
}

export function mergeAudienceFilterParams(
  current: URLSearchParams,
  next: URLSearchParams
): URLSearchParams {
  const merged = new URLSearchParams(current);

  AUDIENCE_FILTER_PARAM_KEYS.forEach(key => merged.delete(key));
  next.forEach((value, key) => merged.append(key, value));

  return merged;
}
