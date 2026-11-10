import { formatInTimeZone } from 'date-fns-tz';

export const ZURICH = 'Europe/Zurich';

/**
 * The calendar day of an instant in Zurich as YYYY-MM-DD, which compares as a
 * string. Not `Intl.DateTimeFormat`: the API binary ships without locale data.
 */
export function zurichDate(instant: string | Date): string {
  return formatInTimeZone(
    typeof instant === 'string' ? new Date(instant) : instant,
    ZURICH,
    'yyyy-MM-dd'
  );
}

export function todayZurich(now = new Date()): string {
  return zurichDate(now);
}

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatDe(ymd: string): string {
  const [year, month, day] = ymd.split('-');

  return `${day}.${month}.${year}`;
}

export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** A calendar day as the UTC midnight a `@db.Date` column expects. */
export function ymdToDbDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** The calendar day a `@db.Date` column holds (Prisma hands it back as UTC midnight). */
export function dbDateToYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}
