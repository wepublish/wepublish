import { FullEventFragment } from '@wepublish/website/api';
import { addDays, format } from 'date-fns';

type CalendarEvent = Pick<
  FullEventFragment,
  'id' | 'name' | 'lead' | 'location' | 'url' | 'startsAt' | 'endsAt'
>;

const isMidnight = (date: Date) => !date.getHours() && !date.getMinutes();

/** 2026-06-16 15:40 UTC → "20260616T154000Z" */
const utc = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/**
 * Start and end of an event for a calendar: an event at midnight lasts whole
 * days (the editor saves those so), up to and with the day it ends on.
 */
const timesOf = ({ startsAt, endsAt }: CalendarEvent) => {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : start;

  if (isMidnight(start) && isMidnight(end)) {
    return {
      allDay: true,
      start: format(start, 'yyyyMMdd'),
      // calendars take the day after the last one as end
      end: format(addDays(end, 1), 'yyyyMMdd'),
    };
  }

  return { allDay: false, start: utc(start), end: utc(end) };
};

/**
 * The address of the event page for a calendar: a link only of the site
 * ("/event/…") gets the address of the site, without it there is none.
 */
const linkOf = ({ url }: CalendarEvent, origin?: string) => {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return origin ? new URL(url, origin).href : undefined;
};

/** A link that opens Google Calendar with the event filled in */
export const googleCalendarUrl = (event: CalendarEvent, origin?: string) => {
  const { start, end } = timesOf(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: [event.lead, linkOf(event, origin)].filter(Boolean).join('\n\n'),
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params}`;
};

/** Text in a calendar file needs its commas, semicolons and line breaks escaped */
const escape = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, match => `\\${match}`)
    .replace(/\r?\n/g, '\\n');

/** The event as calendar file (.ics), for Apple Calendar, Outlook and others */
export const calendarFile = (
  event: CalendarEvent,
  now = new Date(),
  origin?: string
) => {
  const { allDay, start, end } = timesOf(event);
  const time = allDay ? ';VALUE=DATE' : '';
  const link = linkOf(event, origin);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//We.Publish//Website//DE',
    'BEGIN:VEVENT',
    `UID:${event.id}@wepublish.ch`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART${time}:${start}`,
    `DTEND${time}:${end}`,
    `SUMMARY:${escape(event.name)}`,
    event.location && `LOCATION:${escape(event.location)}`,
    event.lead && `DESCRIPTION:${escape(event.lead)}`,
    link && `URL:${link}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
};

/** Lets the browser save the calendar file of the event */
export const downloadCalendarFile = (event: CalendarEvent) => {
  const file = new Blob([calendarFile(event, new Date(), location.origin)], {
    type: 'text/calendar;charset=utf-8',
  });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(file);
  link.download = `${event.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
};
