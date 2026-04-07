import { format, parseISO } from 'date-fns';

export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

export function getPublisherName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy | HH:mm');
  } catch {
    return '';
  }
}

/**
 * Converts dd.mm.yyyy display string to yyyy-mm-dd for API usage.
 * Returns empty string if input is invalid or incomplete.
 */
export function displayDateToIso(display: string): string {
  const match = display.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/**
 * Converts yyyy-mm-dd ISO string to dd.mm.yyyy for display.
 */
export function isoDateToDisplay(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${match[3]}.${match[2]}.${match[1]}`;
}
