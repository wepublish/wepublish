import { EmailQualityLevel } from '@prisma/client';

export type EmailQualityConfig = {
  /** Case-insensitive substrings marking generated addresses, e.g. `@placeholder.example.com`. */
  placeholderPatterns: string[];
  /** User property keys an importer sets to `true` for generated addresses. */
  importMarkerProperties: string[];
  /** Hand flow mails for these levels to paper mail, if a letter integration exists. */
  flowPaperMailEnabled: boolean;
  flowPaperMailLevels: EmailQualityLevel[];
  /** Never send flow mails to these levels. */
  flowSkipLevels: EmailQualityLevel[];
};

export const DEFAULT_EMAIL_QUALITY_CONFIG: EmailQualityConfig = {
  placeholderPatterns: [],
  importMarkerProperties: [],
  flowPaperMailEnabled: false,
  flowPaperMailLevels: [
    EmailQualityLevel.placeholder,
    EmailQualityLevel.undeliverable,
  ],
  flowSkipLevels: [EmailQualityLevel.blocked],
};

const LEVELS = new Set<string>(Object.values(EmailQualityLevel));

const strings = (value: unknown): string[] | undefined =>
  Array.isArray(value) ?
    value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  : undefined;

const levels = (value: unknown): EmailQualityLevel[] | undefined =>
  strings(value)?.filter((item): item is EmailQualityLevel => LEVELS.has(item));

/** Reads the stored setting leniently: unknown or broken parts fall back to the defaults. */
export const parseEmailQualityConfig = (value: unknown): EmailQualityConfig => {
  const input =
    value && typeof value === 'object' ?
      (value as Record<string, unknown>)
    : {};

  return {
    placeholderPatterns:
      strings(input['placeholderPatterns']) ??
      DEFAULT_EMAIL_QUALITY_CONFIG.placeholderPatterns,
    importMarkerProperties:
      strings(input['importMarkerProperties']) ??
      DEFAULT_EMAIL_QUALITY_CONFIG.importMarkerProperties,
    flowPaperMailEnabled:
      typeof input['flowPaperMailEnabled'] === 'boolean' ?
        input['flowPaperMailEnabled']
      : DEFAULT_EMAIL_QUALITY_CONFIG.flowPaperMailEnabled,
    flowPaperMailLevels:
      levels(input['flowPaperMailLevels']) ??
      DEFAULT_EMAIL_QUALITY_CONFIG.flowPaperMailLevels,
    flowSkipLevels:
      levels(input['flowSkipLevels']) ??
      DEFAULT_EMAIL_QUALITY_CONFIG.flowSkipLevels,
  };
};

export const matchesPlaceholderPattern = (
  email: string,
  patterns: string[]
) => {
  const address = email.toLowerCase();

  return patterns.some(pattern => address.includes(pattern.toLowerCase()));
};
