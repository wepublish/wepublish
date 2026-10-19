import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { BlockTiming, Weekday } from './block-timing.model';

const FALLBACK_TIME_ZONE = 'Europe/Zurich';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS: Record<string, Weekday> = {
  '1': Weekday.Monday,
  '2': Weekday.Tuesday,
  '3': Weekday.Wednesday,
  '4': Weekday.Thursday,
  '5': Weekday.Friday,
  '6': Weekday.Saturday,
  '7': Weekday.Sunday,
};

export type TimedBlock = {
  disabled?: boolean | null;
  timing?: BlockTiming | null;
  blocks?: unknown;
  template?: unknown;
};

export const siteTimeZone = () => {
  const timeZone = process.env['TZ'];

  if (!timeZone) {
    return FALLBACK_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat('de-CH', { timeZone });

    return timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
};

const weekdayAt = (date: Date, timeZone: string) =>
  WEEKDAYS[formatInTimeZone(date, timeZone, 'i')];

const timeAt = (date: Date, timeZone: string) =>
  formatInTimeZone(date, timeZone, 'HH:mm');

const withinTimeOfDay = (from: string, to: string, time: string) =>
  from <= to ? time >= from && time < to : time >= from || time < to;

const matchesRule = (rule: BlockTiming, now: Date, timeZone: string) => {
  if (rule.from && now < rule.from) {
    return false;
  }

  if (rule.to && now >= rule.to) {
    return false;
  }

  if (
    rule.weekdays?.length &&
    !rule.weekdays.includes(weekdayAt(now, timeZone))
  ) {
    return false;
  }

  if (
    rule.timeOfDay &&
    !withinTimeOfDay(
      rule.timeOfDay.from,
      rule.timeOfDay.to,
      timeAt(now, timeZone)
    )
  ) {
    return false;
  }

  return true;
};

export const isDisplayedAt = (
  timing: BlockTiming | null | undefined,
  now: Date,
  timeZone = siteTimeZone()
) => !timing || matchesRule(timing, now, timeZone);

export const shouldDisplayBlock = (
  block: TimedBlock,
  now: Date,
  timeZone = siteTimeZone()
) => !block.disabled && isDisplayedAt(block.timing, now, timeZone);

const nestedBlocks = (block: TimedBlock): TimedBlock[] => {
  const nested = Array.isArray(block.blocks) ? block.blocks : [];
  const template = block.template as { blocks?: unknown } | null | undefined;
  const templateBlocks =
    Array.isArray(template?.blocks) ? (template?.blocks as unknown[]) : [];

  return [...nested, ...templateBlocks]
    .map(entry => {
      const withAlignment = entry as { block?: unknown } | null | undefined;

      return (withAlignment?.block ?? entry) as TimedBlock | undefined;
    })
    .filter(
      (entry): entry is TimedBlock => !!entry && typeof entry === 'object'
    );
};

const eachTiming = function* (
  blocks: Iterable<TimedBlock | undefined | null>
): Generator<BlockTiming> {
  for (const block of blocks) {
    if (!block) {
      continue;
    }

    if (block.timing) {
      yield block.timing;
    }

    yield* eachTiming(nestedBlocks(block));
  }
};

const zonedInstant = (day: Date, time: string, timeZone: string) =>
  fromZonedTime(
    `${formatInTimeZone(day, timeZone, 'yyyy-MM-dd')}T${time}:00`,
    timeZone
  );

const ruleBoundaries = (rule: BlockTiming, now: Date, timeZone: string) => {
  const boundaries: Date[] = [];

  if (rule.from) {
    boundaries.push(rule.from);
  }

  if (rule.to) {
    boundaries.push(rule.to);
  }

  const daily =
    rule.timeOfDay ? [rule.timeOfDay.from, rule.timeOfDay.to]
    : rule.weekdays?.length ? ['00:00']
    : [];

  for (const time of daily) {
    for (const offset of [0, 1, 2]) {
      boundaries.push(
        zonedInstant(new Date(now.getTime() + offset * DAY_MS), time, timeZone)
      );
    }
  }

  return boundaries;
};

export const nextTimingChange = (
  blocks: Iterable<TimedBlock | undefined | null>,
  now: Date,
  timeZone = siteTimeZone(),
  withinMs = DAY_MS
): Date | null => {
  let next: Date | null = null;

  for (const rule of eachTiming(blocks)) {
    for (const boundary of ruleBoundaries(rule, now, timeZone)) {
      if (boundary <= now || boundary.getTime() - now.getTime() > withinMs) {
        continue;
      }

      if (!next || boundary < next) {
        next = boundary;
      }
    }
  }

  return next;
};
