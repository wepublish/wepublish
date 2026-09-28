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
