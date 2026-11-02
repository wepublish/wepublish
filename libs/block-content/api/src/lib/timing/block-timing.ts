import { BadRequestException } from '@nestjs/common';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { BlockTiming, Weekday } from './block-timing.model';

const FALLBACK_TIME_ZONE = 'Europe/Zurich';
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
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

type Rule = {
  from: Date | null;
  to: Date | null;
  weekdays: Weekday[];
  timeOfDay: { from: string; to: string } | null;
};

const INVALID = Symbol('invalid timing');

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

const toDate = (value: unknown): Date | null | typeof INVALID => {
  if (value == null) {
    return null;
  }

  const date =
    value instanceof Date ? value
    : typeof value === 'string' || typeof value === 'number' ? new Date(value)
    : null;

  return date && !Number.isNaN(date.getTime()) ? date : INVALID;
};

export const timingDate = (value: unknown) => {
  const date = toDate(value);

  return date === INVALID ? null : date;
};

const isTime = (value: unknown): value is string =>
  typeof value === 'string' && TIME_OF_DAY.test(value);

const parseRule = (timing: BlockTiming): Rule | typeof INVALID => {
  const from = toDate(timing.from);
  const to = toDate(timing.to);

  if (from === INVALID || to === INVALID) {
    return INVALID;
  }

  const weekdays = timing.weekdays ?? [];

  if (
    !Array.isArray(weekdays) ||
    weekdays.some(day => !Object.values(WEEKDAYS).includes(day))
  ) {
    return INVALID;
  }

  const timeOfDay = timing.timeOfDay ?? null;

  if (timeOfDay && (!isTime(timeOfDay.from) || !isTime(timeOfDay.to))) {
    return INVALID;
  }

  return {
    from,
    to,
    weekdays,
    timeOfDay: timeOfDay && { from: timeOfDay.from, to: timeOfDay.to },
  };
};

export const assertValidTiming = (timing: BlockTiming | null | undefined) => {
  if (!timing) {
    return;
  }

  const rule = parseRule(timing);

  if (rule === INVALID) {
    throw new BadRequestException(
      'Block timing needs valid dates, weekdays and a daily window from HH:mm to HH:mm.'
    );
  }

  if (rule.from && rule.to && rule.from >= rule.to) {
    throw new BadRequestException('Block timing has to end after it starts.');
  }
};

type Local = {
  time: string;
  weekday: Weekday;
  previousWeekday: Weekday;
};

const WEEK = Object.values(WEEKDAYS);

const localAt = (at: Date, timeZone: string): Local => {
  const [date, time] = formatInTimeZone(at, timeZone, 'yyyy-MM-dd HH:mm').split(
    ' '
  );
  const [year, month, day] = date.split('-').map(Number);
  const index = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;

  return {
    time,
    weekday: WEEK[index],
    previousWeekday: WEEK[(index + 6) % 7],
  };
};

const matchesRule = (rule: Rule, at: Date, local: () => Local) => {
  if (rule.from && at < rule.from) {
    return false;
  }

  if (rule.to && at >= rule.to) {
    return false;
  }

  if (!rule.timeOfDay && !rule.weekdays.length) {
    return true;
  }

  const { time, weekday, previousWeekday } = local();
  let windowDay = weekday;

  if (rule.timeOfDay) {
    const { from, to } = rule.timeOfDay;

    if (from === to) {
      return false;
    }

    if (from < to) {
      if (time < from || time >= to) {
        return false;
      }
    } else if (time < to) {
      windowDay = previousWeekday;
    } else if (time < from) {
      return false;
    }
  }

  return !rule.weekdays.length || rule.weekdays.includes(windowDay);
};

const lazyLocal = (at: Date, timeZone: string) => {
  let local: Local | undefined;

  return () => (local ??= localAt(at, timeZone));
};

const ruleOf = (timing: BlockTiming | null | undefined) =>
  timing ? parseRule(timing) : null;

const displays = (
  disabled: boolean | null | undefined,
  rule: Rule | null | typeof INVALID,
  at: Date,
  local: () => Local
) => !disabled && rule !== INVALID && (!rule || matchesRule(rule, at, local));

export const isDisplayedAt = (
  timing: BlockTiming | null | undefined,
  now: Date,
  timeZone = siteTimeZone()
) => displays(false, ruleOf(timing), now, lazyLocal(now, timeZone));

export const shouldDisplayBlock = (
  block: TimedBlock,
  now: Date,
  timeZone = siteTimeZone()
) =>
  displays(block.disabled, ruleOf(block.timing), now, lazyLocal(now, timeZone));

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

type TimedNode = {
  disabled: boolean;
  rule: Rule | null | typeof INVALID;
  children: TimedNode[];
};

const compile = (
  blocks: Iterable<TimedBlock | undefined | null>
): TimedNode[] =>
  [...blocks]
    .filter((block): block is TimedBlock => !!block)
    .map(block => ({
      disabled: !!block.disabled,
      rule: ruleOf(block.timing),
      children: compile(nestedBlocks(block)),
    }));

const eachRule = function* (nodes: TimedNode[]): Generator<Rule> {
  for (const node of nodes) {
    if (node.disabled || node.rule === INVALID) {
      continue;
    }

    if (node.rule) {
      yield node.rule;
    }

    yield* eachRule(node.children);
  }
};

const displayedState = (
  nodes: TimedNode[],
  at: Date,
  local: () => Local
): string =>
  nodes
    .map(node =>
      displays(node.disabled, node.rule, at, local) ?
        `1(${displayedState(node.children, at, local)})`
      : '0'
    )
    .join(',');

const localDays = (now: Date, days: number, timeZone: string) => {
  const [year, month, day] = formatInTimeZone(now, timeZone, 'yyyy-MM-dd')
    .split('-')
    .map(Number);

  return Array.from({ length: days }, (_, offset) =>
    new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
  );
};

const offsetMinutes = (time: number, timeZone: string) => {
  const offset = formatInTimeZone(new Date(time), timeZone, 'xxx');
  const [hours, minutes] = offset.slice(1).split(':').map(Number);

  return (offset.startsWith('-') ? -1 : 1) * (hours * 60 + minutes);
};

const offsetChanges = (start: number, end: number, timeZone: string) => {
  const changes: { at: number; delta: number }[] = [];
  const first = Math.floor(start / MINUTE_MS) * MINUTE_MS;

  for (let hour = first; hour < end; hour += HOUR_MS) {
    const offset = offsetMinutes(hour, timeZone);
    const next = offsetMinutes(hour + HOUR_MS, timeZone);

    if (offset === next) {
      continue;
    }

    let before = hour;
    let after = hour + HOUR_MS;

    while (after - before > MINUTE_MS) {
      const middle =
        before + Math.floor((after - before) / 2 / MINUTE_MS) * MINUTE_MS;

      if (offsetMinutes(middle, timeZone) === offset) {
        before = middle;
      } else {
        after = middle;
      }
    }

    changes.push({ at: after, delta: Math.abs(next - offset) * MINUTE_MS });
  }

  return changes;
};

const ruleCandidates = (
  rule: Rule,
  days: string[],
  shifts: number[],
  timeZone: string
) => {
  const candidates: number[] = [];

  if (rule.from) {
    candidates.push(rule.from.getTime());
  }

  if (rule.to) {
    candidates.push(rule.to.getTime());
  }

  const times = [
    ...(rule.timeOfDay ? [rule.timeOfDay.from, rule.timeOfDay.to] : []),
    ...(rule.weekdays.length ? ['00:00'] : []),
  ];

  for (const day of days) {
    for (const time of times) {
      const instant = fromZonedTime(`${day}T${time}:00`, timeZone).getTime();

      candidates.push(instant);

      for (const shift of shifts) {
        candidates.push(instant - shift, instant + shift);
      }
    }
  }

  return candidates;
};

export const nextTimingChange = (
  blocks: Iterable<TimedBlock | undefined | null>,
  now: Date,
  timeZone = siteTimeZone(),
  withinMs = DAY_MS
): Date | null => {
  const tree = compile(blocks);
  const rules = [...eachRule(tree)];

  if (!rules.length) {
    return null;
  }

  const start = now.getTime();
  const horizon = start + withinMs;
  const daily = rules.some(rule => rule.timeOfDay || rule.weekdays.length);
  const changes = daily ? offsetChanges(start, horizon, timeZone) : [];
  const shifts = [...new Set(changes.map(change => change.delta))];
  const days = localDays(now, Math.ceil(withinMs / DAY_MS) + 2, timeZone);
  const candidates = [
    ...rules.flatMap(rule => ruleCandidates(rule, days, shifts, timeZone)),
    ...changes.map(change => change.at),
  ]
    .filter(time => time > start && time <= horizon)
    .sort((a, b) => a - b)
    .filter((time, index, sorted) => time !== sorted[index - 1]);

  const current = displayedState(tree, now, lazyLocal(now, timeZone));

  for (const time of candidates) {
    const at = new Date(time);

    if (displayedState(tree, at, lazyLocal(at, timeZone)) !== current) {
      return at;
    }
  }

  return null;
};
