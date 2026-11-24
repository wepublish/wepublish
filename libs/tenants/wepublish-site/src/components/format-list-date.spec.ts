import { formatListDate } from './format-list-date';

describe('formatListDate', () => {
  const date = new Date(2026, 3, 9, 15, 30).toISOString();

  it('writes the date of an article in German', () => {
    expect(formatListDate(date, 'de')).toBe('09. April 2026');
  });

  it('writes the date of an article in French', () => {
    expect(formatListDate(date, 'fr')).toBe('9 avril 2026');
  });

  it('falls back to German for another language', () => {
    expect(formatListDate(date, undefined)).toBe('09. April 2026');
  });
});
