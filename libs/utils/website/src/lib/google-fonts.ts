import {
  FontStyle,
  FontWeight,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';

export type GoogleFont = Pick<
  WebsiteSettingsFragment['fonts'][number],
  'name' | 'weight' | 'style'
>;

const fontWeightToNumber: Record<FontWeight, number> = {
  [FontWeight.Thin]: 100,
  [FontWeight.ExtraLight]: 200,
  [FontWeight.Light]: 300,
  [FontWeight.Regular]: 400,
  [FontWeight.Medium]: 500,
  [FontWeight.SemiBold]: 600,
  [FontWeight.Bold]: 700,
  [FontWeight.ExtraBold]: 800,
  [FontWeight.Black]: 900,
  [FontWeight.Variable]: 400,
};

export const googleFontsUrl = (fonts: GoogleFont[] | undefined) => {
  const families =
    fonts?.flatMap(font => {
      if (!font.name) {
        return [];
      }

      const fontName = font.name.replace(/ /g, '+');
      const supportsItalic = font.style.includes(FontStyle.Italic);
      const weights = new Set(
        font.weight.map(weight => fontWeightToNumber[weight])
      );
      const weightStr = Array.from(
        weights.values(),
        weight => `0,${weight}`
      ).join(';');
      const italicStr =
        supportsItalic ? `;${weightStr.replace(/0,/g, '1,')}` : '';

      return `family=${fontName}:ital,wght@${weightStr}${italicStr}`;
    }) ?? [];

  if (!families.length) {
    return undefined;
  }

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
};
