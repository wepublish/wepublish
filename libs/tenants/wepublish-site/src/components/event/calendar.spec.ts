import { mockEvent } from '@wepublish/mocks/website';

import { calendarFile, googleCalendarUrl } from './calendar';

// A timed event in UTC, so that the expected times do not depend on the time zone of the test
const talk = mockEvent({
  id: 'talk',
  name: 'KI, Medien; und Demokratie',
  lead: 'Ein Austausch.',
  location: 'Schöngrün, Bern',
  url: 'https://wepublish.ch/event/talk',
  startsAt: new Date(Date.UTC(2026, 5, 16, 15, 40)).toISOString(),
  endsAt: new Date(Date.UTC(2026, 5, 16, 16, 0)).toISOString(),
});

// Whole days in local time, as the editor saves them
const camp = mockEvent({
  id: 'camp',
  name: 'Media Makers Camp',
  lead: null,
  location: null,
  url: 'https://wepublish.ch/event/camp',
  startsAt: new Date(2026, 9, 17).toISOString(),
  endsAt: new Date(2026, 9, 19).toISOString(),
});

describe('googleCalendarUrl', () => {
  it('opens Google Calendar with name, times, place and lead of the event', () => {
    const url = new URL(googleCalendarUrl(talk));

    expect(url.origin + url.pathname).toBe(
      'https://calendar.google.com/calendar/render'
    );
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('KI, Medien; und Demokratie');
    expect(url.searchParams.get('dates')).toBe(
      '20260616T154000Z/20260616T160000Z'
    );
    expect(url.searchParams.get('location')).toBe('Schöngrün, Bern');
    expect(url.searchParams.get('details')).toBe(
      'Ein Austausch.\n\nhttps://wepublish.ch/event/talk'
    );
  });

  it('enters an event over whole days as such, up to and with its last day', () => {
    const url = new URL(googleCalendarUrl(camp));

    expect(url.searchParams.get('dates')).toBe('20261017/20261020');
    expect(url.searchParams.has('location')).toBe(false);
  });
});

describe('links to the event', () => {
  const relative = { ...talk, url: '/event/talk' };

  it('leaves out a link that only works on the site itself', () => {
    expect(
      new URL(googleCalendarUrl(relative)).searchParams.get('details')
    ).toBe('Ein Austausch.');
    expect(calendarFile(relative)).not.toContain('URL:');
  });

  it('completes it with the address of the site', () => {
    expect(
      new URL(
        googleCalendarUrl(relative, 'https://wepublish.ch')
      ).searchParams.get('details')
    ).toBe('Ein Austausch.\n\nhttps://wepublish.ch/event/talk');
    expect(calendarFile(relative, undefined, 'https://wepublish.ch')).toContain(
      'URL:https://wepublish.ch/event/talk'
    );
  });
});

describe('calendarFile', () => {
  const now = new Date(Date.UTC(2026, 10, 13, 9, 0));

  it('describes the event for any calendar app', () => {
    const lines = calendarFile(talk, now).split('\r\n');

    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:talk@wepublish.ch',
        'DTSTAMP:20261113T090000Z',
        'DTSTART:20260616T154000Z',
        'DTEND:20260616T160000Z',
        'SUMMARY:KI\\, Medien\\; und Demokratie',
        'LOCATION:Schöngrün\\, Bern',
        'DESCRIPTION:Ein Austausch.',
        'URL:https://wepublish.ch/event/talk',
        'END:VEVENT',
        'END:VCALENDAR',
      ])
    );
  });

  it('enters an event over whole days as such, up to and with its last day', () => {
    const lines = calendarFile(camp, now).split('\r\n');

    expect(lines).toEqual(
      expect.arrayContaining([
        'DTSTART;VALUE=DATE:20261017',
        'DTEND;VALUE=DATE:20261020',
      ])
    );
    expect(lines.some(line => line.startsWith('LOCATION'))).toBe(false);
  });
});
