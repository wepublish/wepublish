import { Theme } from '@emotion/react';
import { TypographyStyleOptions } from '@mui/material/styles/createTypography';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { CSSProperties } from 'react';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export const customTypographyVariant = 'custom';

/**
 * Name of a typography variant defined on the MUI theme (h1, body1,
 * teaserTitle, ...). Kept as a string because sites can extend the theme with
 * their own variants which are only known at runtime.
 */
export type TypographyVariant = string;

export type TypographyValue = {
  variant?: TypographyVariant | typeof customTypographyVariant;
  /** Only used when `variant` is `custom`. Any CSS length, e.g. `1.25rem` */
  fontSize?: string;
  /** Only used when `variant` is `custom`. Unitless number or CSS length */
  lineHeight?: string;
  /**
   * Only used when `variant` is `custom`. Name of one of the fonts configured
   * in the website settings, unset keeps the theme font.
   */
  fontFamily?: string;
  /** Only used when `variant` is `custom`. Numeric CSS font weight, 100-900 */
  fontWeight?: number;
};

export type TypographyField = BaseField & {
  type: 'typography';
  /** Restrict the selectable theme variants, defaults to all of them */
  variants?: TypographyVariant[];
};

export const typographySchema = z
  .object({
    variant: z.string(),
    fontSize: z.string(),
    lineHeight: z.string(),
    fontFamily: z.string(),
    fontWeight: z.number().min(100).max(900),
  })
  .partial();

export const typographyFieldAi: FieldAiParams = {
  instructions:
    'Typography of the text. Prefer a theme variant (e.g. h1-h6, subtitle1, subtitle2, body1, body2, caption, overline) so the text matches the rest of the website. Only use the variant "custom" together with fontSize (CSS length such as 1.25rem), lineHeight (unitless number such as 1.4), fontFamily (name of a font configured for the website) and fontWeight (100-900) when a theme variant does not fit. Leave unset to keep the component default.',
  schema: toAiSchema(typographySchema),
};

export const fontWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Keys on theme.typography that are not variants
const nonVariantKeys = new Set(['allVariants']);

/**
 * All typography variants defined on the theme, in the order the theme
 * declares them.
 */
export const getThemeTypographyVariants = (theme: Theme): TypographyVariant[] =>
  Object.entries(theme.typography)
    .filter(
      ([key, value]) =>
        !nonVariantKeys.has(key) && typeof value === 'object' && value !== null
    )
    .map(([key]) => key);

/**
 * Resolves the CSS font-family for one of the website fonts, falling back to
 * the theme font so unknown glyphs still look consistent.
 */
export const resolveFontFamily = (theme: Theme, fontFamily?: string) => {
  if (!fontFamily) {
    return theme.typography.fontFamily;
  }

  return [`"${fontFamily}"`, theme.typography.fontFamily]
    .filter(Boolean)
    .join(', ');
};

/**
 * Turns a typography value into CSS: either the styles of the chosen theme
 * variant or the custom font settings.
 */
export const resolveTypography = (
  theme: Theme,
  value: TypographyValue | undefined
): TypographyStyleOptions | undefined => {
  if (!value?.variant) {
    return undefined;
  }

  if (value.variant !== customTypographyVariant) {
    return theme.typography[value.variant as keyof Theme['typography']] as
      | TypographyStyleOptions
      | undefined;
  }

  const styles: CSSProperties = {};

  if (value.fontSize) {
    styles.fontSize = value.fontSize;
  }

  if (value.lineHeight) {
    const numeric = Number(value.lineHeight);
    styles.lineHeight = Number.isNaN(numeric) ? value.lineHeight : numeric;
  }

  if (value.fontFamily) {
    styles.fontFamily = resolveFontFamily(theme, value.fontFamily);
  }

  if (value.fontWeight) {
    styles.fontWeight = value.fontWeight;
  }

  return styles;
};
