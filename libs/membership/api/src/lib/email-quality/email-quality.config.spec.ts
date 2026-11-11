import {
  DEFAULT_EMAIL_QUALITY_CONFIG,
  parseEmailQualityConfig,
} from './email-quality.config';

describe('parseEmailQualityConfig', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_EMAIL_QUALITY_CONFIG).toEqual({
      unresponsiveAfterDays: 180,
      minMailsForUnresponsive: 1,
    });
  });

  it('falls back to the defaults for missing or broken values', () => {
    expect(parseEmailQualityConfig({})).toEqual(DEFAULT_EMAIL_QUALITY_CONFIG);
    expect(
      parseEmailQualityConfig({
        unresponsiveAfterDays: 'soon',
        minMailsForUnresponsive: null,
      })
    ).toEqual(DEFAULT_EMAIL_QUALITY_CONFIG);
  });

  it('takes positive whole numbers, also when stored as strings', () => {
    expect(
      parseEmailQualityConfig({
        unresponsiveAfterDays: 90,
        minMailsForUnresponsive: '3',
      })
    ).toEqual({ unresponsiveAfterDays: 90, minMailsForUnresponsive: 3 });
  });

  it('rejects zero, negatives and fractions', () => {
    expect(
      parseEmailQualityConfig({
        unresponsiveAfterDays: 0,
        minMailsForUnresponsive: 1.5,
      })
    ).toEqual(DEFAULT_EMAIL_QUALITY_CONFIG);
    expect(
      parseEmailQualityConfig({ unresponsiveAfterDays: -10 })
        .unresponsiveAfterDays
    ).toBe(180);
  });
});
