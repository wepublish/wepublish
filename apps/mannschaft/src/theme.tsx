import { createTheme, CSSObject, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import localFont from 'next/font/local';
import { PartialDeep } from 'type-fest';

const plainFont = localFont({
  src: [
    {
      path: '../public/fonts/Plain-Light.otf',
      weight: '400',
    },
    {
      path: '../public/fonts/Plain-Light-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/Plain-Medium.otf',
      weight: '600',
    },
  ],
});

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({ color: { main: '#000', contrastText: '#FFFFFF' } }),
    secondary: augmentColor({ color: { main: '#E94090' } }),
    accent: augmentColor({ color: { main: '#00AEC2', light: '#FFEE00' } }),
    error: augmentColor({ color: { main: '#e4002c' } }),
    warning: augmentColor({ color: { main: '#f07d24' } }),
    info: augmentColor({ color: { main: '#1e398f' } }),
    success: augmentColor({ color: { main: '#0aa537' } }),
  },
  typography: {
    h1: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    allVariants: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    // Article
    articleAuthors: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    // Blocks
    blockBreakTitle: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    blockBreakBody: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    blockQuote: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    blockTitlePreTitle: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserTitle: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserLead: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserMeta: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserPretitle: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    // Banner
    bannerCta: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerText: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerTitle: {
      fontFamily: [plainFont.style.fontFamily, 'sans-serif'].join(','),
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => {
          const baseStyles: CSSObject = {
            color: theme.palette.secondary.main,
            textDecoration: 'none',
          };
          return baseStyles;
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
