import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Hanken_Grotesk } from 'next/font/google';
import { PartialDeep } from 'type-fest';

// eslint-disable-next-line @nx/enforce-module-boundaries
import euclidCircularB_Bold from './fonts/euclid/EuclidCircularB-Bold-WebS.woff2';
import euclidCircularB_LightItalic from './fonts/euclid/EuclidCircularB-LightItalic-WebS.woff2';
import euclidCircularB_Medium from './fonts/euclid/EuclidCircularB-Medium-WebS.woff2';
import euclidCircularB_MediumItalic from './fonts/euclid/EuclidCircularB-MediumItalic-WebS.woff2';

const hankenGrotesk = Hanken_Grotesk({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const colors = {
  primary: {
    main: '#0800ff',
    light: '#f5ff64',
    dark: '#aeb3be',
    contrastText: '#fffff',
  },
  common: {
    black: '#000000',
    white: '#ffffff',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
};

const {
  palette: { augmentColor },
  breakpoints,
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    common: {
      black: colors.common.black,
      white: colors.common.white,
    },
    primary: augmentColor({
      color: {
        main: colors.primary.main,
        light: colors.primary.light,
        dark: colors.primary.dark,
        contrastText: colors.primary.contrastText,
      },
    }),
  },
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
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    // Footer / Header
    categoryLinkTitle: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      color: colors.common.white,
      display: 'inline-block',
      whiteSpace: 'nowrap',
      margin: 0,
      padding: '0 0.3cqw',
      fontSize: '4.5cqw',
      lineHeight: '6cqw',
      fontWeight: 700,
      [breakpoints.up('md')]: {
        fontSize: 'min(1.25cqw, 1.4rem)',
        lineHeight: 'min(1.66cqw, 1.86rem)',
      },
    },
    categoryLinkList: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    categoryLinkItem: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      lineHeight: 0,
    },
    fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Euclid';
          font-display: swap;
          font-style: italic;
          font-weight: 300;
          src: local('Euclid'), local('Euclid-Light-Italic'), url(${euclidCircularB_LightItalic}) format('woff2');
        }
        @font-face {
          font-family: 'Euclid';
          font-display: swap;
          font-style: normal;
          font-weight: 500;
          src: local('Euclid'), local('Euclid-Medium'), url(${euclidCircularB_Medium}) format('woff2');
        }
        @font-face {
          font-family: 'Euclid';
          font-display: swap;
          font-style: italic;
          font-weight: 500;
          src: local('Euclid'), local('Euclid-Medium-Italic'), url(${euclidCircularB_MediumItalic}) format('woff2');
        }
        @font-face {
          font-family: 'Euclid';
          font-display: swap;
          font-style: normal;
          font-weight: 700;
          src: local('Euclid'), local('Euclid-Bold'), url(${euclidCircularB_Bold}) format('woff2');
        }
      `,
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          // Footer / Header
          categoryLinkList: 'ul',
          categoryLinkItem: 'li',
          categoryLinkTitle: 'h6',
        },
      },
    },
    MuiLink: {
      variants: [
        {
          // Footer / Header
          props: { variant: 'categoryLink' },
          style: {
            fontFamily: ['Euclid', 'sans-serif'].join(','),
            fontWeight: 500,
            fontStyle: 'normal',
            color: colors.common.white,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            padding: '0 0.3cqw',
            textDecoration: 'none',
            fontSize: '2rem',
            lineHeight: '4rem',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
            [breakpoints.up('md')]: {
              fontSize: '2rem',
              lineHeight: '4rem',
            },
          },
        },
      ],
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
