import type { PaletteOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import { courantFallbackColors, CourantPaletteColors } from './brand-colors';

const muiBase = createTheme();
const familyFields = ['main', 'light', 'dark', 'contrastText'] as const;
const colorGroups = {
  primary: familyFields,
  secondary: familyFields,
  accent: familyFields,
  info: familyFields,
  success: familyFields,
  warning: familyFields,
  error: familyFields,
  common: ['black', 'white'],
  grey: [
    50,
    100,
    200,
    300,
    400,
    500,
    600,
    700,
    800,
    900,
    'A100',
    'A200',
    'A400',
    'A700',
  ],
  text: ['primary', 'secondary', 'disabled'],
  background: ['default', 'paper'],
  action: [
    'active',
    'hover',
    'selected',
    'disabled',
    'disabledBackground',
    'focus',
  ],
} as const;

export const colorValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const field = (source: unknown, key: string | number): string | undefined =>
  source && typeof source === 'object' ?
    colorValue((source as Record<string, unknown>)[key])
  : undefined;

export const resolveCourantPalette = (
  cms: PaletteOptions | undefined,
  brand: CourantPaletteColors = {}
): PaletteOptions => {
  const palette: Record<string, unknown> = {};

  // Accept color fields only: CMS mode, opacity scales, functions, and other
  // theme behavior cannot change the brand's presentation contract.
  for (const [group, fields] of Object.entries(colorGroups)) {
    const key = group as keyof typeof colorGroups;
    const brandGroup = brand[key];
    const cmsGroup = cms?.[key];
    const fallback = courantFallbackColors[key];
    const authoredMain = field(brandGroup, 'main') ?? field(cmsGroup, 'main');
    const colors: Record<string, string> = {};

    for (const name of fields) {
      // A new main color must not inherit shades from the fallback hue.
      const fallbackValue =
        authoredMain && name !== 'main' ? undefined : field(fallback, name);
      const value =
        field(brandGroup, name) ?? field(cmsGroup, name) ?? fallbackValue;
      if (value !== undefined) colors[name] = value;
    }

    if (!Object.keys(colors).length) continue;
    if (fields === familyFields) {
      const defaultMain = field(muiBase.palette[key], 'main');
      if (defaultMain !== undefined) colors.main ??= defaultMain;
    }
    palette[group] = colors;
  }

  const divider = colorValue(brand.divider) ?? colorValue(cms?.divider);
  if (divider !== undefined) palette.divider = divider;

  // MUI augments built-in families during createTheme, but custom accent needs
  // explicit augmentation. At this point all authored fields are final.
  const accent = muiBase.palette.augmentColor({
    color: palette.accent as { main: string },
    name: 'accent',
  });
  return { ...palette, accent };
};
