export const EVENT_TIME_ZONE = 'Europe/Zurich';

export type ZurichWallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const zurichFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

const floorToSecond = (time: number) => Math.floor(time / 1000) * 1000;

const zurichFieldsAsUtc = (time: number) => {
  const fields: Record<string, number> = {};

  for (const part of zurichFormatter.formatToParts(new Date(time))) {
    if (part.type !== 'literal') {
      fields[part.type] = Number(part.value);
    }
  }

  return Date.UTC(
    fields['year'],
    fields['month'] - 1,
    fields['day'],
    fields['hour'] % 24,
    fields['minute'],
    fields['second']
  );
};

const zurichOffsetAt = (time: number) =>
  zurichFieldsAsUtc(floorToSecond(time)) - floorToSecond(time);

const wallClockAsUtc = (wallClock: ZurichWallClock) =>
  Date.UTC(
    wallClock.year,
    wallClock.month - 1,
    wallClock.day,
    wallClock.hour,
    wallClock.minute,
    wallClock.second,
    wallClock.millisecond
  );

const wallClockFromUtc = (time: number): ZurichWallClock => {
  const date = new Date(time);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
  };
};

export const instantToZurichWallClock = (instant: Date): ZurichWallClock =>
  wallClockFromUtc(instant.getTime() + zurichOffsetAt(instant.getTime()));

export const zurichWallClockToInstant = (
  wallClock: ZurichWallClock,
  reference?: Date
): Date => {
  const local = wallClockAsUtc(wallClock);
  const offsetBefore = zurichOffsetAt(local - DAY_IN_MS);
  const offsetAfter = zurichOffsetAt(local + DAY_IN_MS);

  if (offsetBefore === offsetAfter) {
    return new Date(local - offsetBefore);
  }

  const valid = [offsetBefore, offsetAfter].filter(
    offset => zurichOffsetAt(local - offset) === offset
  );

  if (valid.length === 0) {
    return new Date(local - offsetBefore);
  }

  const referenceOffset = reference && zurichOffsetAt(reference.getTime());
  const offset =
    valid.find(candidate => candidate === referenceOffset) ??
    Math.max(...valid);

  return new Date(local - offset);
};

export const addCalendarDays = (
  wallClock: ZurichWallClock,
  days: number
): ZurichWallClock =>
  wallClockFromUtc(wallClockAsUtc(wallClock) + days * DAY_IN_MS);

export const isoWeekday = (wallClock: ZurichWallClock): number =>
  new Date(
    Date.UTC(wallClock.year, wallClock.month - 1, wallClock.day)
  ).getUTCDay() || 7;
