import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Hanken_Grotesk, Merriweather } from 'next/font/google';
import { PartialDeep } from 'type-fest';

const hankenGrotesk = Hanken_Grotesk({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const theme = createTheme(WePTheme, {
  typography: {
    h1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [merriweather.style.fontFamily, 'sans-serif'].join(','),
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
