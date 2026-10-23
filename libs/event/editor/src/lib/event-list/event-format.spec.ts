import { formatEventDateTime, formatRelativeTime } from './event-format';

describe('formatEventDateTime', () => {
  it('shows weekday, date and time in Zurich time, in summer', () => {
    expect(formatEventDateTime('2027-05-26T17:00:00.000Z', 'en')).toBe(
      'Wed 26 May, 19:00'
    );
  });

  it('shows Zurich time in winter too', () => {
    expect(formatEventDateTime('2027-01-13T19:30:00.000Z', 'en')).toBe(
      'Wed 13 Jan, 20:30'
    );
  });

  it('follows the editor language', () => {
    expect(formatEventDateTime('2027-05-26T17:00:00.000Z', 'de')).toBe(
      'Mi., 26. Mai, 19:00'
    );
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-23T12:00:00.000Z');

  it('counts days', () => {
    expect(formatRelativeTime('2026-10-20T12:00:00.000Z', now, 'en')).toBe(
      '3 days ago'
    );
  });

  it('counts hours within a day', () => {
    expect(formatRelativeTime('2026-10-23T07:00:00.000Z', now, 'en')).toBe(
      '5 hours ago'
    );
  });

  it('counts minutes within an hour', () => {
    expect(formatRelativeTime('2026-10-23T11:50:00.000Z', now, 'en')).toBe(
      '10 minutes ago'
    );
  });

  it('counts months beyond a month', () => {
    expect(formatRelativeTime('2026-07-20T12:00:00.000Z', now, 'en')).toBe(
      '3 months ago'
    );
  });
});
