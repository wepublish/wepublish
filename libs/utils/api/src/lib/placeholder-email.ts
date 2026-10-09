import { PrismaClient } from '@prisma/client';

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

type PlaceholderPatternSource = {
  setting: { findUnique: PrismaClient['setting']['findUnique'] };
  settingLetterProvider: {
    findMany: PrismaClient['settingLetterProvider']['findMany'];
  };
};

export const loadPlaceholderEmailPatterns = async (
  prisma: PlaceholderPatternSource
): Promise<string[]> => {
  const [setting, letterProviders] = await Promise.all([
    prisma.setting.findUnique({
      where: { name: PLACEHOLDER_EMAIL_PATTERNS_SETTING },
    }),
    prisma.settingLetterProvider.findMany({
      select: { placeholderEmailContains: true },
    }),
  ]);

  const fromLetterProviders = letterProviders
    .map(({ placeholderEmailContains }) => placeholderEmailContains?.trim())
    .filter((pattern): pattern is string => !!pattern);

  return [
    ...new Set([
      ...parsePlaceholderEmailPatterns(setting?.value),
      ...fromLetterProviders,
    ]),
  ];
};
