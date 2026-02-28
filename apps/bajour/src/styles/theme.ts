import { createTheme, ThemeOptions } from '@mui/material';
import { createBreakpoints } from '@mui/system';
import { theme as WepTheme } from '@wepublish/ui';
import { Roboto } from 'next/font/google';

const {
  palette: { augmentColor },
} = createTheme();

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const theme = createTheme({}, WepTheme, {
  typography: {
    h1: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.4,
    },
    body2: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [roboto.style.fontFamily, 'sans-serif'].join(','),
  },
  breakpoints: createBreakpoints({
    values: {
      xs: 0,
      sm: 700,
      md: 960,
      lg: 1280,
      xl: 3800,
    },
  }),
  palette: {
    primary: augmentColor({ color: { main: '#FF0D63' } }),
    secondary: augmentColor({
      color: { main: '#FDDDD2', dark: '#ffbaba', light: 'rgb(255, 239, 233)' },
    }),
    accent: augmentColor({ color: { main: '#770A6A' } }),
    error: augmentColor({ color: { main: '#FF0D63' } }),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlinedPrimary: {
          borderWidth: '3px',
          borderColor: '#FF0D63',
          fontWeight: 'bold',
          ':hover': {
            backgroundColor: 'transparent',
            borderWidth: '3px',
          },
        },
        contained: {
          '@media (hover: none)': {
            ':hover': {
              backgroundColor: '#ffbaba',
            },
          },
        },
      },
    },
  },
} as ThemeOptions);

export const navbarTheme = createTheme(theme, {
  palette: {
    primary: theme.palette.secondary,
  },
} as ThemeOptions);

export default theme;
