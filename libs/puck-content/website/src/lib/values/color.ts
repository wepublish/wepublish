import { Theme } from '@emotion/react';

export const paletteColorShades = [
  'main',
  'light',
  'dark',
  'contrastText',
] as const;

export const themeColorGroups = {
  primary: paletteColorShades,
  secondary: paletteColorShades,
  accent: paletteColorShades,
  success: paletteColorShades,
  error: paletteColorShades,
  info: paletteColorShades,
  warning: paletteColorShades,
  text: ['primary', 'secondary', 'disabled'],
  background: ['default', 'paper'],
  common: ['black', 'white'],
} as const;

export type ThemeColorGroups = typeof themeColorGroups;

export type ThemeColorValue = {
  [
    Group in keyof ThemeColorGroups
  ]: `${Group}.${ThemeColorGroups[Group][number]}`;
}[keyof ThemeColorGroups];

export type ThemeColorPath = `${string}.${string}`;

export const themeColors = Object.entries(themeColorGroups).flatMap(
  ([group, shades]) => shades.map(shade => `${group}.${shade}`)
) as ThemeColorValue[];

export type ColorValue = ThemeColorValue | string;

const themeColorPathPattern = /^[a-z][a-z0-9]*\.[a-z0-9]+$/i;
const hexColorPattern = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const pick = (source: unknown, key: string): unknown =>
  isRecord(source) ? source[key] : undefined;

export const isThemeColor = (
  value: unknown,
  colors?: readonly string[]
): value is ThemeColorPath =>
  typeof value === 'string' &&
  (colors ? colors.includes(value) : themeColorPathPattern.test(value));

const getColorAt = (source: unknown, path: ThemeColorPath) => {
  const [group, shade] = path.split('.');
  const color = pick(pick(source, group), shade);

  return typeof color === 'string' ? color : undefined;
};

export const resolvePaletteColor = (
  theme: Theme,
  value: ColorValue | null | undefined
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (!isThemeColor(value)) {
    return value;
  }

  return getColorAt(theme.palette, value);
};

export const resolveColor = (
  theme: Theme,
  value: ColorValue | null | undefined
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (!isThemeColor(value)) {
    return value;
  }

  const vars = 'vars' in theme ? theme.vars : undefined;

  return (
    getColorAt(pick(vars, 'palette'), value) ?? getColorAt(theme.palette, value)
  );
};

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && hexColorPattern.test(value);
