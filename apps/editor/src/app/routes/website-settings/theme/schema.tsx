import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message:
      'Invalid color format. Must be a 3 or 6-character hex code (e.g., #RRGGBB or #RGB).',
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

const fontSizeInput = z.preprocess(val => {
  if (val == null) {
    return val;
  }

  if (typeof val === 'number') {
    return val;
  }

  if (typeof val === 'string') {
    if (val.endsWith('rem')) {
      return parseFloat(val) * 16;
    }

    if (val.endsWith('px')) {
      return parseFloat(val);
    }

    return parseFloat(val);
  }

  return val;
}, z.number().min(8).max(100).nullish());

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
  caption: typographyItem,
});

export const themeSchema = z.object({
  palette: paletteSchema,
  typography: typographySchema,
});
