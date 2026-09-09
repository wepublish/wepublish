import { Theme } from '@emotion/react';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export const customColor = 'custom';

/**
 * Colours of the MUI theme palette that can be picked, grouped the way the
 * palette itself is structured. Each entry becomes a `group.shade` path.
 */
export const themeColorGroups = {
  primary: ['main', 'light', 'dark', 'contrastText'],
  secondary: ['main', 'light', 'dark', 'contrastText'],
  accent: ['main', 'light', 'dark', 'contrastText'],
  success: ['main', 'light', 'dark', 'contrastText'],
  error: ['main', 'light', 'dark', 'contrastText'],
  info: ['main', 'light', 'dark', 'contrastText'],
  warning: ['main', 'light', 'dark', 'contrastText'],
  text: ['primary', 'secondary', 'disabled'],
  background: ['default', 'paper'],
  common: ['black', 'white'],
} as const;

export type ThemeColorGroups = typeof themeColorGroups;

export type ThemeColorValue = {
  [Group in keyof ThemeColorGroups]: `${Group}.${ThemeColorGroups[Group][number]}`;
}[keyof ThemeColorGroups];

export const themeColors = Object.entries(themeColorGroups).flatMap(
  ([group, shades]) => shades.map(shade => `${group}.${shade}`)
) as ThemeColorValue[];

/**
 * Either a path into the theme palette (e.g. `primary.main`) or a custom CSS
 * colour as hex string. Both are also understood by MUI's `sx` prop.
 */
export type ColorValue = ThemeColorValue | string;

export type ColorField = BaseField & {
  type: 'color';
  /** Restrict the selectable theme colours, defaults to all of them */
  colors?: ThemeColorValue[];
  /** Allow entering a custom colour, defaults to true */
  allowCustom?: boolean;
};

export const isThemeColor = (value: unknown): value is ThemeColorValue =>
  typeof value === 'string' && (themeColors as string[]).includes(value);

/**
 * Turns a colour value into a CSS colour by looking theme colours up in the
 * palette. Custom colours are returned as they are.
 */
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

  const [group, shade] = value.split('.') as [keyof ThemeColorGroups, string];

  return (theme.palette[group] as Record<string, string> | undefined)?.[shade];
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
