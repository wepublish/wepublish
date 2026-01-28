import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Open_Sans } from 'next/font/google';
import { PartialDeep } from 'type-fest';

const openSans = Open_Sans({
  weight: ['300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

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
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [openSans.style.fontFamily, 'sans-serif'].join(','),
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
