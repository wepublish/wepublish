import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Hanken_Grotesk } from 'next/font/google';
import { PartialDeep } from 'type-fest';

import euclidCircularB_Bold from './fonts/euclid/EuclidCircularB-Bold-WebS.woff2';
import euclidCircularB_LightItalic from './fonts/euclid/EuclidCircularB-LightItalic-WebS.woff2';
import euclidCircularB_Medium from './fonts/euclid/EuclidCircularB-Medium-WebS.woff2';
import euclidCircularB_MediumItalic from './fonts/euclid/EuclidCircularB-MediumItalic-WebS.woff2';
import recife_Medium from './fonts/recife/RecifeTextWeb-Regular.woff2';

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
    dark: '#1F1F1F',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#0800ff',
    light: '#E7FF04', // link-button main background
    dark: '#2B4E47',
    contrastText: '#ffffff',
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
    secondary: augmentColor({
      color: {
        main: colors.secondary.main,
        light: colors.secondary.light,
        dark: colors.secondary.dark,
        contrastText: colors.secondary.contrastText,
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
      fontFamily: ['Euclid', 'sans-serif'].join(','),
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
    categoryAddress: {
      display: 'block',
      margin: 0,
      padding: 0,
    },
    categoryAddressText: {
      fontFamily: ['Euclid', 'sans-serif'].join(','),
      color: colors.common.white,
      fontSize: '2rem',
      lineHeight: '3rem',
      fontWeight: 500,
      fontStyle: 'normal',
      [breakpoints.up('md')]: {
        fontSize: '2rem',
        lineHeight: '3rem',
      },
    },
    // TeaserSlots
    teaserSlotsTitle: {
      fontFamily: ['Euclid', 'sans-serif'].join(','),
      fontWeight: 500,
      color: colors.common.black,
      textTransform: 'uppercase',
      textAlign: 'center',
      fontSize: '2.5rem',
      paddingBottom: '2rem',
    },
    // Teaser
    teaserTitle: {
      [breakpoints.up('xs')]: {
        fontFamily: ['Euclid', 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        margin: 0,
        padding: '0 4cqw',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: 700,
        fontSize: '8cqw',
        lineHeight: '9cqw',
      },
    },
    teaserTitleLink: {
      [breakpoints.up('xs')]: {
        ['&:after']: {
          content: "''",
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          cursor: 'pointer',
        },
      },
    },
    teaserPretitle: {
      [breakpoints.up('xs')]: {
        fontFamily: ['Euclid', 'sans-serif'].join(','),
        color: colors.common.white,
        backgroundColor: colors.common.black,
        fontSize: 'calc((9 * 100cqw / 16) * 0.045)',
        lineHeight: 'calc((9 * 100cqw / 16) * 0.045)',
        fontWeight: 700,
        padding: '0.5cqw 1.5cqw',
      },
    },
    teaserLead: {
      fontFamily: ['Recife', 'serif'].join(','),
    },
    teaserMeta: {
      [breakpoints.up('xs')]: {
        fontFamily: ['Euclid', 'sans-serif'].join(','),
        backgroundColor: colors.common.white,
        margin: 0,
        fontSize: 'calc((9 * 100cqw / 16) * 0.04)',
        fontWeight: 700,
        padding: '0 1.5cqw',
      },
    },
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
        @font-face {
          font-family: 'Recife';
          font-display: swap;
          font-style: normal;
          font-weight: 500;
          src: local('Recife'), local('Recife-Medium'), url(${recife_Medium}) format('woff2');
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
          categoryAddress: 'address',
          categoryAddressText: 'p',
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
            padding: '0',
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

        // Button-Links
        {
          props: { variant: 'buttonLinkMain' },
          style: {
            fontFamily: ['Euclid', 'sans-serif'].join(','),
            fontWeight: 500,
            textTransform: 'uppercase',
            color: colors.common.black,
            backgroundColor: colors.secondary.light,
            padding: '0.5cqw 1.5cqw',
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: 'calc((9 * 100cqw / 16) * 0.04)',
            lineHeight: 'calc((9 * 100cqw / 16) * 0.04)',
            '&:hover': {
              backgroundColor: colors.secondary.light,
              color: colors.common.black,
              textDecoration: 'none',
            },
          },
        },
        {
          props: { variant: 'buttonLinkSecondary' },
          style: {
            fontFamily: ['Euclid', 'sans-serif'].join(','),
            fontWeight: 500,
            textTransform: 'uppercase',
            borderRadius: '9999px',
            color: colors.common.white,
            backgroundColor: colors.common.black,
            padding: '0.5cqw 1.5cqw',
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: '1rem',
            lineHeight: '1.5rem',
            '&:hover': {
              backgroundColor: colors.common.black,
              color: colors.common.white,
              textDecoration: 'none',
            },
          },
        },
      ],
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&.MuiAccordion-root': {
            boxShadow: 'none',
            border: `1px solid ${colors.common.black}`,
            borderLeft: 'none',
            borderRight: 'none',
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridTemplateRows: 'repeat(2, auto)',
            '&:before': {
              display: 'none',
            },
          },
          '.MuiAccordionSummary-root': {
            fontFamily: ['Euclid', 'sans-serif'].join(','),
            fontWeight: 500,
            padding: '0',
            gridColumn: '-1 / 1',
            gridRow: '1 / 2',
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            textTransform: 'uppercase',
            '.MuiAccordionSummary-content': {
              margin: 0,
              gridColumn: '3 / 9',
            },
            '.MuiTypography-root': {
              textWrap: 'wrap',
            },
          },
          '.MuiCollapse-root': {
            padding: '0',
            gridColumn: '3 / 9',
            gridRow: '2 / 3',
          },
          '.MuiAccordionDetails-root': {
            padding: '0 0 0 .75cqw',
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            fontFamily: ['Euclid', 'sans-serif'].join(','),
            position: 'absolute',
            top: '50%',
            right: '0.75cqw',
            transform: 'translateY(-50%)',
            color: colors.common.black,
            fontWeight: 700,
          },
          '&.Mui-expanded': {
            margin: 0,
            paddingBottom: '1cqw',
          },
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const teaserMoreAboutTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        padding: 0,
        margin: '0 0 calc(var(--sizing-factor) * 1cqw) 0',
        fontSize: 'calc(var(--sizing-factor) * 1.67cqw)',
        lineHeight: 'calc(var(--sizing-factor) * 1.8cqw)',
        fontWeight: 700,
        color: colors.common.black,
        backgroundColor: 'transparent',
      },
    },
    teaserPretitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        fontSize: 'calc(var(--sizing-factor) * 1.1cqw)',
        fontWeight: 700,
        lineHeight: 'calc(var(--sizing-factor) * 1.2cqw)',
        textAlign: 'right',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
        color: colors.common.black,
        justifySelf: 'end',
        paddingRight: 0,
      },
    },
    teaserLead: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        display: 'block',
        fontSize: 'calc(var(--sizing-factor) * 1.3cqw)',
        lineHeight: 'calc(var(--sizing-factor) * 1.4cqw)',
        fontWeight: 400,
        padding: 0,
        backgroundColor: 'transparent',
        color: colors.common.black,
      },
      [breakpoints.up('md')]: {
        margin: 0,
      },
    },
  },
  components: {
    MuiLink: {
      variants: [
        // keep base variants
        ...(theme.components?.MuiLink?.variants ?? []),
        // add teaser-specific variants
        {
          props: { variant: 'teaserPretitleLink' },
          style: {
            fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            display: 'inline',
            textDecoration: 'underline',
            flexGrow: 0,
            padding:
              'calc(var(--sizing-factor) * 0.3cqw) calc(var(--sizing-factor) * 0.5cqw)',
            color: colors.common.black,
            '&:hover': {
              backgroundColor: colors.primary.light,
              color: colors.common.black,
              textDecoration: 'none',
            },
          },
        },
      ],
    },
  },
});

export { theme as default };
