import { Theme } from '@emotion/react';
import {
  decomposeColor,
  getLuminance,
  hslToRgb,
} from '@mui/system/colorManipulator';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

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

export type ThemeColorGroup = {
  group: string;
  shades: string[];
};

export type RgbaValue = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type ColorField = BaseField & {
  type: 'color';
  colors?: ThemeColorPath[];
  allowCustom?: boolean;
};

const fixedColorGroups: Record<string, readonly string[]> = {
  text: themeColorGroups.text,
  background: themeColorGroups.background,
  common: themeColorGroups.common,
};

const paletteGroupOrder: string[] = Object.keys(themeColorGroups).filter(
  group => !(group in fixedColorGroups)
);

const themeColorPathPattern = /^[a-z][a-z0-9]*\.[a-z0-9]+$/i;
const hexColorPattern = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const alphaTolerance = 1 / 255;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const pick = (source: unknown, key: string): unknown =>
  isRecord(source) ? source[key] : undefined;

const definedShades = (value: unknown, shades: readonly string[]) =>
  shades.filter(shade => typeof pick(value, shade) === 'string');

const groupRank = (group: string) => {
  const index = paletteGroupOrder.indexOf(group);

  return index === -1 ? paletteGroupOrder.length : index;
};

export const getThemeColorGroups = (palette: unknown): ThemeColorGroup[] => {
  if (!isRecord(palette)) {
    return [];
  }

  const paletteGroups = Object.entries(palette)
    .filter(
      ([group, value]) =>
        !(group in fixedColorGroups) && typeof pick(value, 'main') === 'string'
    )
    .map(([group, value]) => ({
      group,
      shades: definedShades(value, paletteColorShades),
    }))
    .sort((a, b) => groupRank(a.group) - groupRank(b.group));

  const fixedGroups = Object.entries(fixedColorGroups).flatMap(
    ([group, shades]) => {
      const available = definedShades(palette[group], shades);

      return available.length ? [{ group, shades: available }] : [];
    }
  );

  return [...paletteGroups, ...fixedGroups];
};

export const getThemeColors = (groups: ThemeColorGroup[]): ThemeColorPath[] =>
  groups.flatMap(({ group, shades }) =>
    shades.map((shade): ThemeColorPath => `${group}.${shade}`)
  );

export const filterThemeColorGroups = (
  groups: ThemeColorGroup[],
  colors: readonly string[] | undefined
): ThemeColorGroup[] =>
  colors ?
    groups.flatMap(({ group, shades }) => {
      const allowed = shades.filter(shade =>
        colors.includes(`${group}.${shade}`)
      );

      return allowed.length ? [{ group, shades: allowed }] : [];
    })
  : groups;

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
  value: ColorValue | undefined
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
  value: ColorValue | undefined
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

export const parseHexInput = (input: string): string | undefined => {
  const trimmed = input.trim().toLowerCase();
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

  return isHexColor(hex) ? hex : undefined;
};

export const toRgba = (color: string): RgbaValue | undefined => {
  try {
    const trimmed = color.trim();
    const { type, values } = decomposeColor(
      trimmed.toLowerCase().startsWith('hsl') ? hslToRgb(trimmed) : trimmed
    );
    const [r, g, b, a = 1]: number[] = values;

    if (
      (type !== 'rgb' && type !== 'rgba') ||
      ![r, g, b, a].every(Number.isFinite)
    ) {
      return undefined;
    }

    return { r, g, b, a };
  } catch {
    return undefined;
  }
};

const toHexByte = (value: number) =>
  Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, '0');

export const toHexColor = ({ r, g, b, a }: RgbaValue): string =>
  `#${[r, g, b].map(toHexByte).join('')}${a < 1 ? toHexByte(a * 255) : ''}`;

export const formatColorHex = (color: string | undefined) => {
  const rgba = color ? toRgba(color) : undefined;

  return rgba ? toHexColor(rgba).toUpperCase() : color;
};

const isSameRgba = (first: RgbaValue, second: RgbaValue) =>
  Math.round(first.r) === Math.round(second.r) &&
  Math.round(first.g) === Math.round(second.g) &&
  Math.round(first.b) === Math.round(second.b) &&
  Math.abs(first.a - second.a) <= alphaTolerance;

export const findThemeColor = (
  theme: Theme,
  color: string,
  colors?: readonly string[]
): ThemeColorPath | undefined => {
  const target = toRgba(color);

  if (!target) {
    return undefined;
  }

  const groups = filterThemeColorGroups(
    getThemeColorGroups(theme.palette),
    colors
  );

  return getThemeColors(groups).find(path => {
    const candidate = getColorAt(theme.palette, path);
    const rgba = candidate ? toRgba(candidate) : undefined;

    return !!rgba && isSameRgba(rgba, target);
  });
};

export const isLightColor = (color: string): boolean | undefined => {
  const rgba = toRgba(color);

  if (!rgba) {
    return undefined;
  }

  return getLuminance(`rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`) > 0.3;
};

export const humanizeColorKey = (key: string): string => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

export const colorSchema = (
  values: ThemeColorValue[] = themeColors,
  allowCustom = true
) =>
  allowCustom ?
    z
      .string()
      .regex(
        new RegExp(
          `^(${values.join('|')}|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))$`
        )
      )
  : z.enum(values);

export const colorFieldAi = (
  values: ThemeColorValue[] = themeColors,
  allowCustom = true
): FieldAiParams => ({
  instructions: [
    `Colour of the element. Prefer a theme colour so the element matches the rest of the website. One of: ${values.join(', ')}.`,
    allowCustom &&
      'Alternatively a custom CSS colour as a hex string, e.g. #1a1a1a or #1a1a1a80 with alpha.',
    'Leave unset to keep the theme default. Make sure foreground and background colours keep enough contrast to stay readable.',
  ]
    .filter(Boolean)
    .join(' '),
  schema: toAiSchema(colorSchema(values, allowCustom)),
});
