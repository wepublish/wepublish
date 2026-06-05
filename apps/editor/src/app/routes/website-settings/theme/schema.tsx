import { parseToRgb } from 'polished';
import { RgbaColor } from 'polished/lib/types/color';
import { CSSProperties } from 'react';
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
  background: z.object({
    default: hexColor,
    paper: hexColor,
  }),
  text: z.object({
    primary: hexColor,
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

type CssUnit = 'em' | 'rem' | 'px';
type UnitRanges = Record<CssUnit, { min: number; max: number }>;

function cssLengthValue(ranges: UnitRanges) {
  return z
    .string()
    .regex(/^-?(\d+\.?\d*|\.\d+)(em|rem|px)$/, {
      message: 'Must be a value with unit (e.g., "1em", "16px", "1rem").',
    })
    .refine(
      val => {
        const match = val.match(/^(-?[\d.]+)(em|rem|px)$/);

        if (!match) {
          return false;
        }

        const num = parseFloat(match[1]);
        const unit = match[2] as CssUnit;

        return num >= ranges[unit].min && num <= ranges[unit].max;
      },
      val => {
        const match = val.match(/^(-?[\d.]+)(em|rem|px)$/);
        const unit = (match?.[2] ?? 'em') as CssUnit;

        return {
          message: `Value must be between ${ranges[unit].min}${unit} and ${ranges[unit].max}${unit}.`,
        };
      }
    )
    .nullish();
}

export const typographyItem = z.object({
  fontFamily: z.string().nullish(),
  fontSize: cssLengthValue({
    em: { min: 0.5, max: 6.5 },
    rem: { min: 0.5, max: 6.5 },
    px: { min: 8, max: 100 },
  }),
  lineHeight: cssLengthValue({
    em: { min: 1, max: 3 },
    rem: { min: 1, max: 3 },
    px: { min: 12, max: 60 },
  }),
  fontWeight: z.number().min(100).max(1000).nullish(),
  letterSpacing: cssLengthValue({
    em: { min: -0.1, max: 0.2 },
    rem: { min: -0.1, max: 1.5 },
    px: { min: -2, max: 5 },
  }),
  textTransform: z
    .enum(['none', 'capitalize', 'uppercase', 'lowercase'])
    .nullish(),
  fontStyle: z.enum(['normal', 'italic']).nullish(),
});

export const typographySchema = z.object({
  allVariants: z.object({
    fontFamily: z.string().nullish(),
    lineHeight: cssLengthValue({
      em: { min: 0.5, max: 6.5 },
      rem: { min: 0.5, max: 6.5 },
      px: { min: 8, max: 100 },
    }),
    letterSpacing: cssLengthValue({
      em: { min: -0.1, max: 0.2 },
      rem: { min: -0.1, max: 1.5 },
      px: { min: -2, max: 5 },
    }),
    fontWeight: z.number().min(100).max(1000).nullish(),
  }),

  h1: typographyItem,
  h2: typographyItem,
  h3: typographyItem,
  h4: typographyItem,
  h5: typographyItem,
  h6: typographyItem,
  body1: typographyItem,
  body2: typographyItem,
  caption: typographyItem,
  subtitle1: typographyItem,
  subtitle2: typographyItem,

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
  return (dec + 0x10000).toString(16).slice(-2).toUpperCase();
}

const fontWeightNames: Record<string, number> = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  extralight: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  'semi-bold': 600,
  semibold: 600,
  'demi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  extrabold: 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
  bolder: 700,
  lighter: 300,
};

export const normalizeValues = (
  value: string | number,
  key: keyof CSSProperties
) => {
  if (typeof value === 'string') {
    if (key === 'fontWeight') {
      return fontWeightNames[value.toLowerCase()] ?? value;
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

  if (typeof value === 'number') {
    if (key === 'lineHeight') {
      return `${value}em`;
    }

    if (key === 'fontWeight') {
      return value;
    }

    return `${value}px`;
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

      return [k, normalizeValues(v, k as keyof CSSProperties)];
    })
  ) as z.infer<typeof themeSchema>;
};
