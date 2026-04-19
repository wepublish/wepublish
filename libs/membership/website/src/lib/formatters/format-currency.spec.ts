import { Currency } from '@wepublish/website/api';
import { formatCurrency, roundUpTo5Cents } from './format-currency';

// Intl.NumberFormat uses different thousands separators depending on the ICU data version.
const normalize = (s: string) =>
  s.replace(/[\u2019\u0027]/g, "'").replace(/\u00a0/g, ' ');

describe('formatCurrency', () => {
  it('should format CHF without decimals in the swiss german locale', () => {
    expect(normalize(formatCurrency(50000, Currency.Chf, 'de-CH'))).toBe(
      "CHF 50'000.-"
    );
  });

  it('should format CHF with decimals in the swiss german locale', () => {
    expect(normalize(formatCurrency(50000.25, Currency.Chf, 'de-CH'))).toBe(
      "CHF 50'000.25"
    );
  });

  it('should format CHF in another locale', () => {
    expect(normalize(formatCurrency(50000, Currency.Chf, 'de-DE'))).toBe(
      '50.000,00 CHF'
    );
  });

  it('should format a number without decimals in the swiss german locale but as euros', () => {
    expect(normalize(formatCurrency(50000, Currency.Eur, 'de-CH'))).toBe(
      "EUR 50'000.00"
    );
  });

  it('should format a number without decimals in the german locale as euros', () => {
    expect(normalize(formatCurrency(50000, Currency.Eur, 'de-DE'))).toBe(
      '50.000,00 \u20AC'
    );
  });
});

describe('roundUpTo5Cents', () => {
  it('should round up below 0.05', () => {
    expect(roundUpTo5Cents(0.04)).toMatchInlineSnapshot(`0.05`);
  });

  it('should round up above 0.05', () => {
    expect(roundUpTo5Cents(0.06)).toMatchInlineSnapshot(`0.1`);
  });

  it('should not round up at 0.05', () => {
    expect(roundUpTo5Cents(0.05)).toMatchInlineSnapshot(`0.05`);
  });
});
