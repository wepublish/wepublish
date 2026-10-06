import {
  FontStyle,
  FontWeight,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';

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
  [FontWeight.Variable]: 400, // dont care about variable here
};

/**
 * Lifted out of `libs/utils/website/src/lib/pages/document-page.tsx`, which is
 * a `_document.tsx` helper and therefore unusable here. Returns the
 * `<link rel>` descriptors for the route's `head()`.
 */
export const websiteSettingsFontLinks = (
  websiteSettings: WebsiteSettingsFragment | undefined
) => {
  const fonts =
    websiteSettings?.fonts.flatMap(font => {
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

  if (!fonts.length) {
    return [];
  }

  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
    {
      rel: 'stylesheet',
      href: `https://fonts.googleapis.com/css2?${fonts.join('&')}&display=swap`,
    },
  ];
};
