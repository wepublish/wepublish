import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

const openSans = { family: 'Open Sans' };

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({
      color: { main: '#FBFB06', light: '#FBFB06', contrastText: '#383A4D' },
    }),
  },
  typography: {
    h1: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [openSans.family, 'sans-serif'].join(','),
    },
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255, 0.75)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#383A4D',
          textDecorationColor: 'currentColor',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: '#383A4D',
          borderColor: 'currentColor',
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
