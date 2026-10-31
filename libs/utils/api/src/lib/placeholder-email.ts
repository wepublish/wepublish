export const matchesPlaceholderEmail = (
  email: string | null | undefined,
  patterns: readonly string[]
): boolean => {
  if (!email) {
    return false;
  }

  const normalized = email.toLowerCase();

  return patterns.some(pattern => {
    const trimmed = pattern.trim().toLowerCase();

    return !!trimmed && normalized.includes(trimmed);
  });
};

export const PLACEHOLDER_EMAIL_PATTERNS_SETTING = 'placeholderEmailPatterns';

export const parsePlaceholderEmailPatterns = (value: unknown): string[] => {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/[,;\n]/)
    .map(pattern => pattern.trim())
    .filter(pattern => pattern.length > 0);
};
