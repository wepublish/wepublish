import type {
  Color,
  CommonColors,
  SimplePaletteColorOptions,
  TypeAction,
  TypeBackground,
  TypeText,
} from '@mui/material/styles';

import type { CourantTypographyRole } from './brand-tokens';
import { courantTokens } from './brand-tokens';

const { colors } = courantTokens;

type ColorValue = string | null | undefined;
type ColorFields<T> = {
  [K in keyof T as NonNullable<T[K]> extends string ? K : never]?: ColorValue;
};

export type CourantPaletteColors = Partial<
  Record<
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error',
    ColorFields<SimplePaletteColorOptions>
  >
> & {
  common?: ColorFields<CommonColors>;
  grey?: ColorFields<Color>;
  text?: ColorFields<TypeText>;
  background?: ColorFields<TypeBackground>;
  action?: ColorFields<TypeAction>;
  divider?: ColorValue;
};

type RoleColors = { color?: ColorValue; backgroundColor?: ColorValue };

export type CourantColorOverrides = {
  palette?: CourantPaletteColors;
  typography?: Partial<Record<CourantTypographyRole, RoleColors>>;
  teaserLabel?: RoleColors;
};

// Colors set here will override colors set in the CMS. If not defined explicitly, it will fallback to CMS values
export const courantColors: CourantColorOverrides = {
  palette: {
    primary: {
      main: colors.courant[500],
    },
  },
  typography: {
    caption: { color: colors.warmGray[700] },
  },
  teaserLabel: { color: colors.warmGray[400], backgroundColor: 'transparent' },
};

// Raw last-resort fallback colors
export const courantFallbackColors: CourantPaletteColors = {
  primary: { main: '#FDEB0B' },
  secondary: { main: colors.black },
  accent: { main: '#000000', light: '#666666' },
  grey: { 800: '#1a1a1a' },
};
