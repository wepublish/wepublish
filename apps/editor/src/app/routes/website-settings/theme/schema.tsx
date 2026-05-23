import { parseToRgb } from 'polished';
import { RgbaColor } from 'polished/lib/types/color';
import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
    message:
      'Invalid color format. Must be a 3, 6 or 8-character hex code (e.g., #RRGGBBBAA #RRGGBB or #RGB).',
  })
  .nullish();

export const paletteSchema = z.object({
  primary: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  secondary: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  accent: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  divider: hexColor,
  info: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  success: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  error: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
  warning: z.object({
    main: hexColor,
    light: hexColor,
    dark: hexColor,
    contrastText: hexColor,
  }),
});

const fontSizeInput = z.number().min(8).max(100).nullish();

export const typographyItem = z.object({
  fontSize: fontSizeInput,
  lineHeight: z.number().min(1).max(3).nullish(),
  fontWeight: z.number().min(100).max(1000).nullish(),
  letterSpacing: z.number().min(-0.1).max(1.5).nullish(),
});

export const typographySchema = z.object({
  h1: typographyItem,
  h2: typographyItem,
  h3: typographyItem,
  h4: typographyItem,
  h5: typographyItem,
  h6: typographyItem,
  body1: typographyItem,
  body2: typographyItem,
  caption: typographyItem,

  teaserPretitle: typographyItem,
  teaserTitle: typographyItem,
  teaserLead: typographyItem,
  teaserMeta: typographyItem,

  articleAuthors: typographyItem,

  peerInformation: typographyItem,

  bannerTitle: typographyItem,
  bannerText: typographyItem,
  bannerCta: typographyItem,

  blockBreakTitle: typographyItem,
  blockBreakBody: typographyItem,

  blockTitlePreTitle: typographyItem,

  blockQuote: typographyItem,
});

export const themeSchema = z.object({
  palette: paletteSchema,
  typography: typographySchema,
});

function decimalToHex(dec: number) {
  return (dec + 0x10000).toString(16).substr(-2).toUpperCase();
}

export const normalizeValues = (value: string | number) => {
  if (typeof value === 'string') {
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16;
    }

    if (value.endsWith('px')) {
      return parseFloat(value);
    }

    if (
      value.startsWith('rgb') ||
      value.startsWith('hsl') ||
      value.startsWith('hsv') ||
      value.startsWith('rgba')
    ) {
      const val = parseToRgb(value) as RgbaColor;

      return `#${decimalToHex(val.red)}${decimalToHex(val.green)}${decimalToHex(val.blue)}${decimalToHex((val.alpha ?? 1) * 100)}`;
    }

    if (value.startsWith('#')) {
      return value;
    }

    return value;
  }

  return value;
};

export const normalizeTheme = <T extends object>(
  theme: T
): z.infer<typeof themeSchema> => {
  return Object.fromEntries(
    Object.entries(theme).map(([k, v]) => {
      if (v && typeof v === 'object') {
        return [k, normalizeTheme(v)];
      }

      return [k, normalizeValues(v)];
    })
  ) as z.infer<typeof themeSchema>;
};
