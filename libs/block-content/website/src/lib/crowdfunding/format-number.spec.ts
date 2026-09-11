import { formatNumber } from './format-number';

describe('formatNumber', () => {
  it('should group thousands with an apostrophe in the swiss german locale', () => {
    expect(formatNumber(50000)).toBe("50'000");
  });

  it('should not group numbers below thousand', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('should group millions in the swiss german locale', () => {
    expect(formatNumber(1234567)).toBe("1'234'567");
  });

  it('should format numbers in another locale', () => {
    expect(formatNumber(50000, 'de-DE')).toBe('50.000');
  });

  it('should normalize the group separator across CLDR versions', () => {
    expect(formatNumber(50000)).not.toMatch(/[\u2019\u02bc]/);
  });

  it('should normalize non breaking spaces across CLDR versions', () => {
    expect(formatNumber(50000, 'fr-FR')).not.toMatch(/[\u00a0\u202f\u2009]/);
  });
});
