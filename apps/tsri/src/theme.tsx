import { createTheme } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Hanken_Grotesk } from 'next/font/google';

const hankenGrotesk = Hanken_Grotesk({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const colors = {
  primary: {
    main: '#0c9eed', // TSRI Blue
    light: '#f5ff64', // TSRI Yellow
    dark: '#aeb3be', // TSRI Grey
    contrastText: '#fffff',
  },
  common: {
    black: '#000000',
    white: '#ffffff',
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
        main: colors.primary.main, // TSRI Blue
        light: colors.primary.light, // TSRI Yellow
        dark: colors.primary.dark, // TSRI Grey
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
      fontSize: '16px',
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
    // Article
    articleAuthors: {
      lineHeight: 1.7,
    },
    // Teaser
    teaserTitle: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserPretitle: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserLead: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserMeta: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    // Header

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
    // Footer
    footerSupportHeading: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      color: colors.primary.main,
      fontWeight: 700,
      fontSize: '1.1rem',
      lineHeight: '1.1rem',
      margin: '0 auto 0.5rem auto',
      padding: '0.8rem 0 0 0',
    },
    footerSupportText: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      margin: '0 auto 1.5rem auto',
      fontWeight: 400,
      lineHeight: '1.2rem',
      color: colors.common.white,
      fontSize: '0.9rem',
    },
    footerSupportImprint: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '0.65rem',
      lineHeight: '0.8rem',
      paddingTop: '2rem',
      margin: '0 auto',
      color: colors.common.white,
    },
    // Banner
    bannerTitle: {
      ...WePTheme.typography.h3,
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerText: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerCta: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedSizeLarge: () => ({
          padding: `${WePTheme.spacing(1.5)} ${WePTheme.spacing(3)}`,
          fontSize: '1.1em',
        }),
        '&:hover': {
          backgroundColor: '#f5ff64',
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          // Footer / Header
          categoryLinkList: 'ul',
          categoryLinkItem: 'li',
          categoryLinkTitle: 'h6',
          // Footer
          footerSupportHeading: 'h6',
          footerSupportText: 'p',
          footerSupportImprint: 'p',
        },
      },
    },
    MuiLink: {
      variants: [
        // Header --> Navbar --> NavbarTabs
        {
          props: { variant: 'navbarTab' },
          style: {
            fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            backgroundColor: colors.common.black,
            color: colors.common.white,
            fontSize: `calc(var(--sizing-factor) * 1.2cqw)`,
            lineHeight: `calc(var(--sizing-factor) * 1.2cqw)`,
            textAlign: 'left',
            border: 0,
            outline: 0,
            userSelect: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            borderTopLeftRadius: '2cqw',
            borderTopRightRadius: '2cqw',
            boxSizing: 'border-box',
            gridColumn: '2 / 3',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            textDecoration: 'none',
            height: '7.2cqw',
            padding: `calc(var(--sizing-factor) * 0.75cqw)
              calc(var(--sizing-factor) * 1cqw)`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: colors.primary.light,
              color: colors.common.black,
            },
            [breakpoints.up('md')]: {
              borderTopLeftRadius: '1cqw',
              borderTopRightRadius: '1cqw',
              height: 'auto',
            },
          },
        },
        {
          // Footer / Header
          props: { variant: 'categoryLink' },
          style: {
            fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            color: colors.common.black,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            padding: '0 0.3cqw',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '4.5cqw',
            lineHeight: '6.5cqw',
            '&:hover': {
              backgroundColor: colors.primary.light,
              textDecoration: 'none',
            },
            [breakpoints.up('md')]: {
              fontSize: 'min(1.25cqw, 1.4rem)',
              lineHeight: 'min(2cqw, 1.65rem)',
            },
            [breakpoints.up('xl')]: {
              fontSize: '1.4rem',
              lineHeight: '2rem',
            },
          },
        },
      ],
    },
    MuiToolbar: {
      variants: [
        {
          props: { variant: 'navbarInnerWrapper' },
          style: {
            minHeight: 'unset',
            aspectRatio: 'var(--changing-aspect-ratio)',
            margin: '0 auto',
            width: '100%',
            backgroundColor: colors.common.white,
            maxWidth: 1333,
            container: 'toolbar/inline-size',
            position: 'static',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: '1fr min-content min-content',
            gridTemplateRows: 'repeat(2, auto)',
            transition:
              'background-color 100ms ease-out 200ms, aspect-ratio 300ms ease-out',
            [breakpoints.up('md')]: {
              gridTemplateRows: 'unset',
            },
          },
        },
      ],
    },
  },
});

export { theme as default };
