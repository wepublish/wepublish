import { EVENT_TIME_ZONE } from '@wepublish/event/schedule';

const LOCALES: Record<string, string> = {
  en: 'en-GB',
  de: 'de-CH',
  fr: 'fr-CH',
};

const localeOf = (language: string) =>
  LOCALES[language.split('-')[0]] ?? LOCALES['en'];

export const formatEventDateTime = (date: string | Date, language: string) =>
  new Intl.DateTimeFormat(localeOf(language), {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(date));

export const formatEventDate = (date: string | Date, language: string) =>
  new Intl.DateTimeFormat(localeOf(language), {
    timeZone: EVENT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

export const formatRelativeTime = (
  date: string | Date,
  now: Date,
  language: string
) => {
  const elapsed = now.getTime() - new Date(date).getTime();
  const format = new Intl.RelativeTimeFormat(localeOf(language), {
    numeric: 'auto',
  });

  if (elapsed < HOUR) {
    return format.format(-Math.round(elapsed / MINUTE), 'minute');
  }

  if (elapsed < DAY) {
    return format.format(-Math.round(elapsed / HOUR), 'hour');
  }

  if (elapsed < MONTH) {
    return format.format(-Math.round(elapsed / DAY), 'day');
  }

  return format.format(-Math.round(elapsed / MONTH), 'month');
};
