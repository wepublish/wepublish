export type EmailQualityConfig = {
  /** Days without a login or click after which a mailed address counts as unresponsive. */
  unresponsiveAfterDays: number;
  /** Delivered mails an address needs before it can count as unresponsive. */
  minMailsForUnresponsive: number;
};

export const DEFAULT_EMAIL_QUALITY_CONFIG: EmailQualityConfig = {
  unresponsiveAfterDays: 180,
  minMailsForUnresponsive: 1,
};

const positiveInteger = (value: unknown): number | undefined => {
  const number =
    typeof value === 'string' && value.trim() ? Number(value) : value;

  return typeof number === 'number' && Number.isInteger(number) && number > 0 ?
      number
    : undefined;
};

/** Reads the two stored settings leniently: a missing or broken value falls back to its default. */
export const parseEmailQualityConfig = (
  values: Partial<Record<keyof EmailQualityConfig, unknown>>
): EmailQualityConfig => ({
  unresponsiveAfterDays:
    positiveInteger(values.unresponsiveAfterDays) ??
    DEFAULT_EMAIL_QUALITY_CONFIG.unresponsiveAfterDays,
  minMailsForUnresponsive:
    positiveInteger(values.minMailsForUnresponsive) ??
    DEFAULT_EMAIL_QUALITY_CONFIG.minMailsForUnresponsive,
});
