import { FontStyle, FontWeight } from '@wepublish/editor/api';

import fontsData from './theme/all-fonts.json';

export type GoogleFont = {
  family: string;
  variants: string[];
};

export type GoogleFontVariants = {
  weight: FontWeight[];
  style: FontStyle[];
};

export const googleFonts: GoogleFont[] = fontsData.items.map(
  ({ family, variants }) => ({ family, variants })
);

const fontsByFamily = new Map(googleFonts.map(font => [font.family, font]));

const weightOf: Record<string, FontWeight> = {
  regular: FontWeight.Regular,
  '100': FontWeight.Thin,
  '200': FontWeight.ExtraLight,
  '300': FontWeight.Light,
  '500': FontWeight.Medium,
  '600': FontWeight.SemiBold,
  '700': FontWeight.Bold,
  '800': FontWeight.ExtraBold,
  '900': FontWeight.Black,
};

export const googleFont = (family: string | null | undefined) =>
  fontsByFamily.get(family ?? '');

function supportedWeights(font: GoogleFont): FontWeight[] {
  const weights = new Set<FontWeight>();

  for (const variant of font.variants) {
    const weight = weightOf[variant.replace('italic', '') || 'regular'];

    if (weight) {
      weights.add(weight);
    }
  }

  return [...weights];
}

function supportedStyles(font: GoogleFont): FontStyle[] {
  const styles = new Set<FontStyle>();

  for (const variant of font.variants) {
    if (variant.includes('italic')) {
      styles.add(FontStyle.Italic);
    }

    if (variant !== 'italic') {
      styles.add(FontStyle.Normal);
    }
  }

  return [...styles];
}

export function googleFontVariants(
  family: string | null | undefined
): GoogleFontVariants | undefined {
  const font = googleFont(family);

  if (font === undefined) {
    return undefined;
  }

  return { weight: supportedWeights(font), style: supportedStyles(font) };
}

const loadedFamilies = new Set<string>();

export function loadGoogleFont(family: string) {
  if (loadedFamilies.has(family)) {
    return;
  }

  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`;
  loadedFamilies.add(family);
  document.head.append(link);
}
