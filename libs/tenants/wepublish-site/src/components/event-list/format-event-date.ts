import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { de, fr } from 'date-fns/locale';

// How each language writes days and times (French as in Switzerland: "13h30")
const styles = {
  de: {
    locale: de,
    day: 'EEEE, d. MMMM yyyy',
    dayOfMonth: 'd.',
    dayMonth: 'd. MMMM',
    date: 'd. MMMM yyyy',
    time: (hours: string, minutes?: string) =>
      minutes ? `${hours}.${minutes}` : hours,
    hours: (times: string) => `${times} Uhr`,
  },
  fr: {
    locale: fr,
    day: 'EEEE d MMMM yyyy',
    dayOfMonth: 'd',
    dayMonth: 'd MMMM',
    date: 'd MMMM yyyy',
    time: (hours: string, minutes?: string) =>
      minutes ? `${hours}h${minutes}` : `${hours}h`,
    hours: (times: string) => times,
  },
};

const isMidnight = (date: Date) => !date.getHours() && !date.getMinutes();

/**
 * The date of an event as the design writes it, in German
 * "Mittwoch, 18. November 2026, 13.30–15 Uhr" on one day and
 * "17.–19. Oktober 2026" over several days, in French
 * "mercredi 18 novembre 2026, 13h30–15h" and "17–19 octobre 2026".
 */
export const formatEventDate = (
  startsAt: string,
  endsAt?: string | null,
  language?: string
) => {
  const style = language === 'fr' ? styles.fr : styles.de;
  const formatDate = (date: Date, pattern: string) =>
    format(date, pattern, { locale: style.locale });
  const formatTime = (date: Date) =>
    style.time(
      formatDate(date, 'H'),
      date.getMinutes() ? formatDate(date, 'mm') : undefined
    );

  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : undefined;

  if (!end || isSameDay(start, end)) {
    const day = formatDate(start, style.day);

    if (isMidnight(start)) {
      return day;
    }

    return end ?
        `${day}, ${style.hours(`${formatTime(start)}–${formatTime(end)}`)}`
      : `${day}, ${style.hours(formatTime(start))}`;
  }

  if (isSameMonth(start, end)) {
    return `${formatDate(start, style.dayOfMonth)}–${formatDate(end, style.date)}`;
  }

  if (isSameYear(start, end)) {
    return `${formatDate(start, style.dayMonth)} – ${formatDate(end, style.date)}`;
  }

  return `${formatDate(start, style.date)} – ${formatDate(end, style.date)}`;
};
