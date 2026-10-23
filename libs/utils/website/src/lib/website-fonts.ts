import { FontStyle, FontWeight, WebsiteSettingsFragment } from '@wepublish/website/api';

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
 * The `family=…` fragments for a Google Fonts `css2` request, derived from the
 * fonts configured in the CMS.
 *
 * Framework-neutral so the Next `_document` and a non-Next HTML shell build the
 * same URL. Previously duplicated in two places, which drifted.
 */
export const websiteSettingsFontFamilies = (
  websiteSettings: WebsiteSettingsFragment | undefined
): string[] =>
  websiteSettings?.fonts.flatMap(font => {
    if (!font.name) {
      return [];
    }

    const fontName = font.name.replace(/ /g, '+');
    const supportsItalic = font.style.includes(FontStyle.Italic);
    const weights = new Set(font.weight.map(weight => fontWeightToNumber[weight]));
    const weightStr = Array.from(weights.values(), weight => `0,${weight}`).join(';');
    const italicStr = supportsItalic ? `;${weightStr.replace(/0,/g, '1,')}` : '';

    return `family=${fontName}:ital,wght@${weightStr}${italicStr}`;
  }) ?? [];

export const GOOGLE_FONTS_PRECONNECT = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous' as const,
  },
];

/** Full `<link>` descriptor list, including the stylesheet href. */
export const websiteSettingsFontLinks = (
  websiteSettings: WebsiteSettingsFragment | undefined
) => {
  const families = websiteSettingsFontFamilies(websiteSettings);

  if (!families.length) {
    return [];
  }

  return [
    ...GOOGLE_FONTS_PRECONNECT,
    {
      rel: 'stylesheet',
      href: `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`,
    },
  ];
};
