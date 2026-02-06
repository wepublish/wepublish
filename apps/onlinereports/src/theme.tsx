import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Inter, Lora } from 'next/font/google';
import { PartialDeep } from 'type-fest';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const lora = Lora({
  weight: ['600'],
  style: ['italic'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const {
  breakpoints,
  palette: { augmentColor },
} = WePTheme;

const palette: ThemeOptions['palette'] = {
  ...WePTheme.palette,
  text: {
    primary: '#141414',
    secondary: '#10243A',
    disabled: '#7C7C7C',
  },
  primary: augmentColor({
    color: {
      main: '#E1190F',
      contrastText: '#fff',
    },
  }),
  secondary: augmentColor({
    color: {
      main: '#89B9DC',
      contrastText: '#10243A',
    },
  }),
};

const theme = createTheme(WePTheme, {
  palette,
  typography: {
    h1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '32px',
      [breakpoints.up('md')]: {
        fontSize: '44px',
      },
      fontWeight: 700,
    },
    h2: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '28px',
      [breakpoints.up('md')]: {
        fontSize: '36px',
      },
      fontWeight: 700,
    },
    h3: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '24px',
      [breakpoints.up('md')]: {
        fontSize: '24px',
      },
      fontWeight: 700,
    },
    h4: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '21px',
      [breakpoints.up('md')]: {
        fontSize: '21px',
      },
      fontWeight: 700,
    },
    h5: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 500,
      fontSize: '18px',
    },
    body1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 300,
      fontSize: 18,
    },
    body2: {
      fontWeight: 300,
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      color: palette?.text?.disabled ?? 'inherit',
    },
    button: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [lora.style.fontFamily, 'sans-serif'].join(','),
      fontStyle: 'italic',
      fontWeight: 600,
    },
    blockBreakBody: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '16px',
      lineHeight: '1.7',
      fontWeight: 300,
      color: palette?.text?.primary ?? 'inherit',
      [breakpoints.up('md')]: {
        fontSize: '22px',
      },
    },
    fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '18px',
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
