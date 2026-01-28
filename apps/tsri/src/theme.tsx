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
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: colors.common.white,
        margin: 0,
        fontSize: 'calc((9 * 100cqw / 16) * 0.08)',
        lineHeight: '1.05',
        fontWeight: 700,
        padding: '1.5cqw 1.5cqw 2.2cqw',
      },
    },
    teaserTitleLink: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
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
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        color: colors.common.white,
        backgroundColor: colors.common.black,
        fontSize: 'calc((9 * 100cqw / 16) * 0.045)',
        lineHeight: 'calc((9 * 100cqw / 16) * 0.045)',
        fontWeight: 700,
        padding: '0.5cqw 1.5cqw',
      },
    },
    teaserLead: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      display: 'none',
    },
    teaserMeta: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: colors.common.white,
        margin: 0,
        fontSize: 'calc((9 * 100cqw / 16) * 0.04)',
        fontWeight: 700,
        padding: '0 1.5cqw',
      },
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

export const teaserTopicMetaTheme = createTheme(theme, {
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
    },
  },
  components: {
    MuiLink: {
      variants: [
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

export const teaserMoreAboutTheme = createTheme(teaserTopicMetaTheme, {
  typography: {
    teaserPretitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        fontSize: '4cqw',
        fontWeight: 700,
        lineHeight: '5cqw',
      },
      [breakpoints.up('md')]: {
        fontSize: '1.1cqw',
        lineHeight: '1.2cqw',
      },
    },
  },
});

export const teaserHeroTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.down('md')]: {
        marginRight: '2cqw',
      },
    },
    teaserPretitle: {
      [breakpoints.down('md')]: {
        marginRight: '2cqw',
      },
    },
    teaserMeta: {
      [breakpoints.down('md')]: {
        marginRight: '2cqw',
      },
    },
  },
});

export const sidebarDailyBriefingTheme = createTheme(theme, {
  typography: {
    dailyBriefingLinkList: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid',
      gridAutoRows: 'min-content',
      fontSize: 'calc(var(--sizing-factor) * 1.3cqw)',
      lineHeight: 'calc(var(--sizing-factor) * 1.49cqw)',
      fontWeight: 700,
    },
    dailyBriefingLinkItem: {
      color: colors.common.black,
      margin: '0 0 calc(var(--sizing-factor) * 0.2cqw) 0',
    },
  },
  components: {
    MuiLink: {
      variants: [
        {
          props: { variant: 'dailyBriefingLink' },
          style: {
            fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(
              ','
            ),
            color: colors.common.black,
            textDecoration: 'none',
            padding: 'calc(var(--sizing-factor) * 0.5cqw)',
            display: 'block',
            backgroundColor: colors.common.white,
            ['&:hover']: {
              backgroundColor: colors.primary.light,
              color: colors.common.black,
            },
          },
        },
      ],
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          dailyBriefingLinkList: 'ul',
          dailyBriefingLinkItem: 'li',
        },
      },
    },
  },
});

export const sidebarEventsTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.up('xs')]: {
        color: colors.common.black,
        fontSize: 'calc(var(--sizing-factor) * 1.3cqw)',
        lineHeight: 'calc(var(--sizing-factor) * 1.49cqw)',
        fontWeight: 700,
        padding: 0,
        margin: 0,
      },
    },
    teaserTitleLink: {
      [breakpoints.up('xs')]: {
        color: colors.common.black,
        textDecoration: 'none',
        padding: '0.5cqw',
        display: 'block',
        backgroundColor: colors.common.white,
        ['&:hover']: {
          backgroundColor: colors.primary.main,
          color: colors.common.white,
        },
      },
    },
  },
});

export const sidebarShopProductsTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        color: 'inherit',
        fontSize: 'calc(var(--sizing-factor) * 1.3cqw)',
        lineHeight: 'calc(var(--sizing-factor) * 1.49cqw)',
        fontWeight: 700,
        padding:
          'calc(var(--sizing-factor) * 0.9cqw) 0 calc(var(--sizing-factor) * 0.2cqw) 0',
        margin: 0,
        backgroundColor: 'transparent',
      },
    },
    teaserTitleLink: {
      [breakpoints.up('xs')]: {},
    },
    teaserLead: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        color: 'inherit',
        display: 'block',
        fontSize: 'calc(var(--sizing-factor) * 1.2cqw)',
        lineHeight: 'calc(var(--sizing-factor) * 1.5cqw)',
        fontWeight: 400,
        padding: 0,
      },
    },
  },
});

export const teaserTwoRowTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      [breakpoints.up('xs')]: {
        fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
        padding: '1.8cqw 2cqw',
        gridRow: '2 / 3',
        fontSize: '4.5cqw',
        lineHeight: '4.5cqw',
        wordWrap: 'nowrap',
        textWrap: 'wrap',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      },
      [breakpoints.up('md')]: {
        padding: '1.8cqw 1cqw',
        fontSize: '2.6cqw',
        lineHeight: '3cqw',
      },
    },
    teaserPretitle: {
      [breakpoints.up('xs')]: {
        display: 'inline-block',
        fontWeight: 700,
        padding: '1.2cqw 2cqw',
        fontSize: '2.6cqw',
      },
      [breakpoints.up('md')]: {
        padding: '0.7cqw 1cqw',
        fontSize: '1.3cqw',
        lineHeight: '1.3cqw',
      },
    },
    teaserLead: {
      [breakpoints.up('xs')]: {
        display: 'block',
        padding: '0.6cqw 2cqw 3cqw 2cqw',
        margin: 0,
        gridRow: '3 / 4',
        backgroundColor: colors.common.white,
        height: '100%',
        fontSize: '3.5cqw',
        lineHeight: '4cqw',
        fontWeight: 700,
      },
      [breakpoints.up('md')]: {
        padding: '0.6cqw 1cqw 3cqw 1cqw',
        fontSize: '1.67cqw',
        lineHeight: '1.6cqw',
      },
    },
    teaserMeta: {
      [breakpoints.up('xs')]: {
        fontSize: '2.6cqw',
        lineHeight: '2.6cqw',
        fontWeight: 700,
        padding: '1.2cqw 2cqw',
        gridRow: '4 / 5',
      },
      [breakpoints.up('md')]: {
        fontSize: '1.05cqw',
        lineHeight: '1.2cqw',
        padding: '0.4cqw 1cqw',
      },
    },
  },
});

export const noImageAltColor = createTheme(theme, {
  typography: {
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
  },
});

export const sidebarTsriLove = createTheme(theme, {
  typography: {
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
  },
});

export const teaserTwoColAuthor = createTheme(theme, {
  typography: {
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
  },
});

export const teaserTwoRowAuthor = createTheme(theme, {
  typography: {
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
  },
});

export const teaserTwoRow = createTheme(theme, {
  typography: {
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
  },
});

export { theme as default };
