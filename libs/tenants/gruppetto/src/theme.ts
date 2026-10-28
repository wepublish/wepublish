import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

const theme = createTheme(WePTheme, {
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

export { theme as default };
