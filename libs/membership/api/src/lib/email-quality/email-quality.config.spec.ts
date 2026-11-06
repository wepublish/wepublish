import { EmailQualityLevel } from '@prisma/client';
import {
  DEFAULT_EMAIL_QUALITY_CONFIG,
  matchesPlaceholderPattern,
  parseEmailQualityConfig,
} from './email-quality.config';

describe('parseEmailQualityConfig', () => {
  it('falls back to the defaults for a missing or broken value', () => {
    expect(parseEmailQualityConfig(null)).toEqual(DEFAULT_EMAIL_QUALITY_CONFIG);
    expect(parseEmailQualityConfig('nope')).toEqual(
      DEFAULT_EMAIL_QUALITY_CONFIG
    );
  });

  it('keeps valid parts and drops the rest', () => {
    expect(
      parseEmailQualityConfig({
        placeholderPatterns: [' @placeholder.example.com ', '', 42],
        flowPaperMailEnabled: 'yes',
        flowPaperMailLevels: ['placeholder', 'nonsense'],
      })
    ).toEqual({
      ...DEFAULT_EMAIL_QUALITY_CONFIG,
      placeholderPatterns: ['@placeholder.example.com'],
      flowPaperMailLevels: [EmailQualityLevel.placeholder],
    });
  });
});

describe('matchesPlaceholderPattern', () => {
  it('matches anywhere in the address, ignoring case', () => {
    expect(
      matchesPlaceholderPattern('A.B@Email-An-Zwoelf.ch', [
        '@email-an-zwoelf.ch',
      ])
    ).toBe(true);
    expect(
      matchesPlaceholderPattern('jane@example.com', ['@placeholder'])
    ).toBe(false);
  });

  it('matches nothing without patterns', () => {
    expect(matchesPlaceholderPattern('x@y.ch', [])).toBe(false);
  });
});
