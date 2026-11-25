import { de } from 'date-fns/locale';
import {
  formatInSiteTimeZone,
  isSameDayInSiteTimeZone,
} from './site-time-zone';

describe('formatInSiteTimeZone', () => {
  // Tests run with TZ=UTC, like the website containers.
  it('formats in Zurich time, not the runtime time zone', () => {
    const justAfterMidnightInZurich = new Date('2026-11-27T23:30:00.000Z');

    expect(
      formatInSiteTimeZone(justAfterMidnightInZurich, 'dd. MMMM yyyy HH:mm', {
        locale: de,
      })
    ).toBe('28. November 2026 00:30');
  });

  it('follows daylight saving time', () => {
    expect(
      formatInSiteTimeZone(new Date('2026-07-03T22:00:00.000Z'), 'dd.MM. HH:mm')
    ).toBe('04.07. 00:00');
  });
});

describe('isSameDayInSiteTimeZone', () => {
  it('compares calendar days in Zurich time', () => {
    expect(
      isSameDayInSiteTimeZone(
        new Date('2026-11-27T23:30:00.000Z'),
        new Date('2026-11-28T01:00:00.000Z')
      )
    ).toBe(true);
    expect(
      isSameDayInSiteTimeZone(
        new Date('2026-11-27T22:30:00.000Z'),
        new Date('2026-11-27T23:30:00.000Z')
      )
    ).toBe(false);
  });
});
