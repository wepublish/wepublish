import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

export const gruppettoTheme = createTheme(theme, {
  palette: {
    primary: {
      main: '#F084AD',
      dark: '#BC4D77',
    },
    background: {
      default: '#FFFAFC',
    },
  },
  shape: {
    borderRadius: 3,
  },
  typography: {
    allVariants: {
      fontFamily: 'Roboto, sans-serif',
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const SITE_TITLE = 'Gruppetto - Das neue Schweizer Radsportmagazin';
