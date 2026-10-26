export type MeterRead = [articleId: string, minute: number, referral?: 1];

export type Meter = { reads: MeterRead[] };

export const MAX_METER_READS = 200;

const MINUTES_PER_DAY = 24 * 60;

export const emptyMeter = (): Meter => ({ reads: [] });

export const toMinute = (date: Date) => Math.floor(date.getTime() / 60_000);

const windowStart = (windowDays: number, now: Date) =>
  toMinute(now) - windowDays * MINUTES_PER_DAY;

const readsInWindow = (meter: Meter, windowDays: number, now: Date) => {
  const start = windowStart(windowDays, now);

  return meter.reads.filter(([, minute]) => minute >= start);
};

export const hasRead = (
  meter: Meter,
  articleId: string,
  windowDays: number,
  now: Date
) => readsInWindow(meter, windowDays, now).some(([id]) => id === articleId);

export const countedReads = (
  meter: Meter,
  windowDays: number,
  now: Date,
  exceptArticleId?: string
) =>
  readsInWindow(meter, windowDays, now).filter(
    ([id, , referral]) => !referral && id !== exceptArticleId
  ).length;

export const referralReads = (meter: Meter, windowDays: number, now: Date) =>
  readsInWindow(meter, windowDays, now).filter(([, , referral]) => referral)
    .length;

export function recordRead(
  meter: Meter,
  articleId: string,
  now: Date,
  { maxWindowDays, referral }: { maxWindowDays: number; referral?: boolean }
): Meter {
  const reads = readsInWindow(meter, maxWindowDays, now);

  if (reads.some(([id]) => id === articleId)) {
    return { reads };
  }

  const read: MeterRead =
    referral ? [articleId, toMinute(now), 1] : [articleId, toMinute(now)];

  return { reads: [...reads, read].slice(-MAX_METER_READS) };
}

export function mergeMeters(a: Meter, b: Meter): Meter {
  const first = new Map<string, MeterRead>();

  for (const read of [...a.reads, ...b.reads]) {
    const known = first.get(read[0]);

    if (!known || read[1] < known[1]) {
      first.set(read[0], read);
    }
  }

  return {
    reads: [...first.values()]
      .sort((x, y) => x[1] - y[1])
      .slice(-MAX_METER_READS),
  };
}

const isMeterRead = (value: unknown): value is MeterRead =>
  Array.isArray(value) &&
  (value.length === 2 || (value.length === 3 && value[2] === 1)) &&
  typeof value[0] === 'string' &&
  Number.isInteger(value[1]);

export const isMeter = (value: unknown): value is Meter =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Array.isArray((value as Meter).reads) &&
  (value as Meter).reads.every(isMeterRead);
