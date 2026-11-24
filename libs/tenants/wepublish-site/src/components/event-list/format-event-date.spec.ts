import { formatEventDate } from './format-event-date';

// Local times, so that the expected text does not depend on the time zone of the test
const at = (month: number, day: number, hours = 0, minutes = 0, year = 2026) =>
  new Date(year, month - 1, day, hours, minutes).toISOString();

describe('formatEventDate', () => {
  it('shows the weekday, the date and the hours of an event on one day', () => {
    expect(formatEventDate(at(10, 16, 14), at(10, 16, 16))).toBe(
      'Freitag, 16. Oktober 2026, 14–16 Uhr'
    );
  });

  it('shows the minutes when an event does not start on the hour', () => {
    expect(formatEventDate(at(11, 18, 13, 30), at(11, 18, 15))).toBe(
      'Mittwoch, 18. November 2026, 13.30–15 Uhr'
    );
  });

  it('shows only the start time when the event has no end', () => {
    expect(formatEventDate(at(11, 18, 13, 30), null)).toBe(
      'Mittwoch, 18. November 2026, 13.30 Uhr'
    );
  });

  it('leaves out the time of an event that lasts the whole day', () => {
    expect(formatEventDate(at(11, 18), null)).toBe(
      'Mittwoch, 18. November 2026'
    );
  });

  it('joins the days of an event over several days in the same month', () => {
    expect(formatEventDate(at(10, 17), at(10, 19))).toBe(
      '17.–19. Oktober 2026'
    );
  });

  it('names both months of an event over the end of a month', () => {
    expect(formatEventDate(at(9, 30), at(10, 2))).toBe(
      '30. September – 2. Oktober 2026'
    );
  });

  it('names both years of an event over the new year', () => {
    expect(formatEventDate(at(12, 30), at(1, 2, 0, 0, 2027))).toBe(
      '30. Dezember 2026 – 2. Januar 2027'
    );
  });

  describe('in French', () => {
    it('shows the weekday, the date and the hours of an event on one day', () => {
      expect(formatEventDate(at(10, 16, 14), at(10, 16, 16), 'fr')).toBe(
        'vendredi 16 octobre 2026, 14h–16h'
      );
    });

    it('shows the minutes when an event does not start on the hour', () => {
      expect(formatEventDate(at(11, 18, 13, 30), at(11, 18, 15), 'fr')).toBe(
        'mercredi 18 novembre 2026, 13h30–15h'
      );
    });

    it('shows only the start time when the event has no end', () => {
      expect(formatEventDate(at(11, 18, 13, 30), null, 'fr')).toBe(
        'mercredi 18 novembre 2026, 13h30'
      );
    });

    it('leaves out the time of an event that lasts the whole day', () => {
      expect(formatEventDate(at(11, 18), null, 'fr')).toBe(
        'mercredi 18 novembre 2026'
      );
    });

    it('joins the days of an event over several days in the same month', () => {
      expect(formatEventDate(at(10, 17), at(10, 19), 'fr')).toBe(
        '17–19 octobre 2026'
      );
    });

    it('names both months of an event over the end of a month', () => {
      expect(formatEventDate(at(9, 30), at(10, 2), 'fr')).toBe(
        '30 septembre – 2 octobre 2026'
      );
    });

    it('names both years of an event over the new year', () => {
      expect(formatEventDate(at(12, 30), at(1, 2, 0, 0, 2027), 'fr')).toBe(
        '30 décembre 2026 – 2 janvier 2027'
      );
    });
  });
});
