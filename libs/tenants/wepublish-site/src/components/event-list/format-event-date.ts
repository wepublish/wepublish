import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { de } from 'date-fns/locale';

const formatDate = (date: Date, pattern: string) =>
  format(date, pattern, { locale: de });

/** 14 → "14", 13:30 → "13.30" */
const formatTime = (date: Date) =>
  date.getMinutes() ? formatDate(date, 'H.mm') : formatDate(date, 'H');

const isMidnight = (date: Date) => !date.getHours() && !date.getMinutes();

/**
 * The date of an event as the design writes it:
 * "Mittwoch, 18. November 2026, 13.30–15 Uhr" on one day,
 * "17.–19. Oktober 2026" over several days.
 */
export const formatEventDate = (startsAt: string, endsAt?: string | null) => {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : undefined;

  if (!end || isSameDay(start, end)) {
    const day = formatDate(start, 'EEEE, d. MMMM yyyy');

    if (isMidnight(start)) {
      return day;
    }

    return end ?
        `${day}, ${formatTime(start)}–${formatTime(end)} Uhr`
      : `${day}, ${formatTime(start)} Uhr`;
  }

  if (isSameMonth(start, end)) {
    return `${formatDate(start, 'd.')}–${formatDate(end, 'd. MMMM yyyy')}`;
  }

  if (isSameYear(start, end)) {
    return `${formatDate(start, 'd. MMMM')} – ${formatDate(end, 'd. MMMM yyyy')}`;
  }

  return `${formatDate(start, 'd. MMMM yyyy')} – ${formatDate(end, 'd. MMMM yyyy')}`;
};
