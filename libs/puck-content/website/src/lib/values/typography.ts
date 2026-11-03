import { Theme } from '@emotion/react';
import { TypographyStyle } from '@mui/material/styles';

export const customTypographyVariant = 'custom';

export type TypographyVariant = string;

export type TypographyValue = {
  variant?: TypographyVariant | typeof customTypographyVariant;
  fontSize?: string;
  lineHeight?: string;
  fontFamily?: string;
  fontWeight?: number;
};

const nonVariantKeys = new Set(['allVariants']);

export const getThemeTypographyVariants = (theme: Theme): TypographyVariant[] =>
  Object.entries(theme.typography)
    .filter(
      ([key, value]) =>
        !nonVariantKeys.has(key) && typeof value === 'object' && value !== null
    )
    .map(([key]) => key);

export const resolveFontFamily = (theme: Theme, fontFamily?: string) => {
  if (!fontFamily) {
    return theme.typography.fontFamily;
  }

  return [`"${fontFamily}"`, theme.typography.fontFamily]
    .filter(Boolean)
    .join(', ');
};

export const resolveTypography = (
  theme: Theme,
  value: TypographyValue | undefined
): TypographyStyle | undefined => {
  if (!value?.variant) {
    return undefined;
  }

  if (value.variant !== customTypographyVariant) {
    return theme.typography[value.variant as keyof Theme['typography']] as
      TypographyStyle | undefined;
  }

  const styles: TypographyStyle = {};

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
