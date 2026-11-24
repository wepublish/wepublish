import { normalizeCountry } from './country-code';

describe('normalizeCountry', () => {
  it('keeps an alpha-2 code', () => {
    expect(normalizeCountry('ch')).toBe('CH');
    expect(normalizeCountry('DE')).toBe('DE');
  });

  it('maps the country names the address form collects today', () => {
    expect(normalizeCountry('Schweiz')).toBe('CH');
    expect(normalizeCountry('suisse')).toBe('CH');
    expect(normalizeCountry('Deutschland')).toBe('DE');
    expect(normalizeCountry('Österreich')).toBe('AT');
  });

  it('returns null for anything it cannot map', () => {
    expect(normalizeCountry('Absurdistan')).toBeNull();
    expect(normalizeCountry('')).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
    expect(normalizeCountry(undefined)).toBeNull();
  });
});
