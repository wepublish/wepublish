import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { createBreakpoints } from '@mui/system';
import { theme as WePTheme } from '@wepublish/ui';
import { Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { PartialDeep } from 'type-fest';

export const recife = localFont({
  src: [
    {
      path: '../public/fonts/recife/RecifeTextWeb-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/recife/RecifeTextWeb-RegularItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/recife/RecifeTextWeb-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

export const euclidCircularB = localFont({
  src: [
    {
      path: '../public/fonts/euclid/EuclidCircularB-Light-WebS.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/euclid/EuclidCircularB-LightItalic-WebS.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/fonts/euclid/EuclidCircularB-Medium-WebS.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/euclid/EuclidCircularB-MediumItalic-WebS.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/euclid/EuclidCircularB-Bold-WebS.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

export const robotoMono = Roboto_Mono({
  weight: ['400'],
  style: ['normal'],
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

const breakPointValues = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1133,
  xl: 1133,
  xxl: 1133,
};

const {
  palette: { augmentColor },
  breakpoints,
} = WePTheme;

const theme = createTheme(WePTheme, {
  breakpoints: createBreakpoints({
    values: breakPointValues,
  }),
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
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
    },
    // heading 1 (part of the hero block, or standalone if no hero block is used)
    h2: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
    },
    // heading 2 with number
    h4: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    // zwischentitel
    h5: {
      fontFamily: [recife.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 700,
      fontSize: '1.125rem',
    },
    h6: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [recife.style.fontFamily, 'serif'].join(','),
    },
    body2: {
      fontFamily: [recife.style.fontFamily, 'serif'].join(','),
    },
    button: {
      fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '0.75rem',
      lineHeight: 1.2,
    },
    overline: {
      fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      fontStyle: 'normal',
    },
    subtitle2: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 400,
      fontStyle: 'normal',
    },
    // Table of Contents - RichText
    tocHeading: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 500,
      lineHeight: 1.15,
      fontSize: '1.5rem',
      textTransform: 'uppercase',
      color: colors.common.white,
      padding: '1.5rem 0',
    },
    tocDetails: {
      fontFamily: [recife.style.fontFamily, 'serif'].join(','),
      paddingBottom: '2rem',
    },
    ulToc: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    liToc: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      lineHeight: 0,
      marginBottom: 0,
    },
    // Downloads - CollapsibleRichText
    ulDownloads: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    liDownloads: {
      listStyle: 'none',
      padding: 0,
      lineHeight: 0,
      marginBottom: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '0.5rem 0',
      '&:before': {
        content: "''",
        width: '1.5rem',
        height: '1.5rem',
        display: 'flex',
        flexShrink: 0,
        flexGrow: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: `url("data:image/svg+xml,%3Csvg stroke='%23000000' fill='%23000000' stroke-width='0' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='none' d='M0 0h24v24H0z'%3E%3C/path%3E%3Cpath d='M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: 0.3,
      },
      '&:hover': {
        '&:before': {
          opacity: 1,
        },
      },
    },
    // BlockQuote
    blockQuote: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 500,
      lineHeight: 1.2,
      fontSize: '3rem',
      '& + cite': {
        fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
        fontStyle: 'normal',
        textTransform: 'uppercase',
        fontSize: '1.125rem',
        lineHeight: 1,
        fontWeight: 400,
      },
    },
    // Footer / Header
    categoryLinkTitle: {
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
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
      fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
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
        fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(','),
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
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          // Footer / Header
          categoryLinkList: 'ul',
          categoryLinkItem: 'li',
          categoryLinkTitle: 'h6',
          categoryAddress: 'address',
          categoryAddressText: 'p',
          // Table of Contents - RichText
          tocHeading: 'div',
          tocDetails: 'div',
          ulToc: 'ul',
          liToc: 'li',
          // Downloads - CollapsibleRichText
          ulDownloads: 'ul',
          liDownloads: 'li',
        },
      },
    },
    MuiLink: {
      variants: [
        {
          // Footer / Header
          props: { variant: 'categoryLink' },
          style: {
            fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(
              ','
            ),
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

        // Table of Contents - RichText
        {
          props: { variant: 'linkToc' },
          style: {
            fontFamily: [recife.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 700,
            lineHeight: 1,
            fontSize: '1.125rem',
            color: colors.common.white,
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },

        // Downloads - CollapsibleRichText
        {
          props: { variant: 'linkDownloads' },
          style: {
            fontFamily: [recife.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 400,
            lineHeight: 1,
            fontSize: '1.25rem',
            color: colors.common.black,

            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },

        // Button-Links
        {
          props: { variant: 'buttonLinkMain' },
          style: {
            fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(
              ','
            ),
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
            fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(
              ','
            ),
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
            borderRadius: 0,
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridTemplateRows: 'repeat(2, auto)',
            '&:before': {
              display: 'none',
            },
          },
          '.MuiAccordionSummary-root': {
            fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            fontWeight: 500,
            padding: '0',
            gridColumn: '-1 / 1',
            gridRow: '1 / 2',
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            textTransform: 'uppercase',
            fontSize: '2rem',
            '.MuiAccordionSummary-content': {
              margin: 0,
              gridColumn: '3 / 9',
            },
            '.MuiTypography-root': {
              textWrap: 'wrap',
            },
            '&.Mui-expanded': {
              minHeight: '48px',
            },
          },
          '.MuiCollapse-root': {
            padding: '0',
            gridColumn: '3 / 9',
            gridRow: '2 / 3',
            '.MuiCollapse-wrapper': {
              marginTop: '0.75rem',
            },
          },
          '.MuiAccordionDetails-root': {
            padding: '0 0 0 .75cqw',
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            fontFamily: [euclidCircularB.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            position: 'absolute',
            top: '50%',
            right: '0.75cqw',
            transform: 'translateY(-50%)',
            color: colors.common.black,
            fontWeight: 700,
            transition:
              'transform 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important',
            '&.Mui-expanded': {
              transition:
                'transform 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important',
              transform: 'translateY(-50%) rotate(0deg)',
            },
          },
          '&.Mui-expanded': {
            margin: 0,
            paddingBottom: '1cqw',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }: { theme: any }) => ({
          [theme.breakpoints.up('md')]: {
            maxWidth: `${breakPointValues.md + 48}px`,
          },
          [theme.breakpoints.up('lg')]: {
            maxWidth: `${breakPointValues.lg + 48}px`,
          },
          [theme.breakpoints.up('xl')]: {
            maxWidth: `${breakPointValues.xl + 48}px`,
          },
          [theme.breakpoints.up('xxl')]: {
            maxWidth: `${breakPointValues.xxl + 48}px`,
          },
        }),
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const teaserMoreAboutTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
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
        fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
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
        fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
        display: 'block',
        fontSize: '1.125rem',
        lineHeight: '1.4rem',
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
            fontFamily: [robotoMono.style.fontFamily, 'sans-serif'].join(','),
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
