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
    },
    // Footer
    footerSupportHeading: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      color: colors.primary.main,
      fontWeight: 700,
      fontSize: '0.8rem',
      lineHeight: '1rem',
      margin: '0 auto 0.5rem auto',
    },
    footerSupportText: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      margin: '0 auto 1.5rem auto',
      fontWeight: 400,
      lineHeight: '1rem',
      color: colors.common.white,
      fontSize: '0.8rem',
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
            lineHeight: '6cqw',
            '&:hover': {
              backgroundColor: colors.primary.light,
              textDecoration: 'none',
            },
            [breakpoints.up('md')]: {
              fontSize: 'min(1.25cqw, 1.4rem)',
              lineHeight: 'min(1.66cqw, 1.86rem)',
            },
          },
        },
      ],
    },
  },
});

export { theme as default };
