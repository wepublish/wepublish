import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { alpha, createBreakpoints } from '@mui/system';
import { responsiveProperty, theme as WePTheme } from '@wepublish/ui';
import { Inter } from 'next/font/google';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

const mergeDeepAll = reduce(mergeDeepRight, {});

const interFont = Inter({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const colors = {
  primary: {
    main: '#EB5851', // ORANGE, used for navbar bg
    light: '#EFF9F0', // MINT, used for teaser bg
    dark: '#210115', // DARK_GREY, used for footer bg
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#F3FF89',
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
    // headings
    ...{
      h1: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
      },
      h2: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        textTransform: 'none',
        fontWeight: 600,
        lineHeight: 1.4,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 24,
              md: 40,
            },
          }),
        ]),
      },
      h3: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        textTransform: 'uppercase',
        fontWeight: 500,
        fontSize: '3rem',
        lineHeight: 1.2,
      },
      h4: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        textTransform: 'uppercase',
        fontWeight: 500,
        fontSize: '1.5rem',
      },
      h5: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontWeight: 700,
        fontSize: '1.125rem',
      },
      h6: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
      },
      blockTitlePreTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        padding: 0,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              md: 24,
            },
          }),
          responsiveProperty({
            cssProperty: 'lineHeight',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 22,
            },
          }),
        ]),
      },
      subtitle1: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontWeight: 400,
        fontSize: '1.5rem',
        lineHeight: 1.2,
        fontStyle: 'normal',
      },
      subtitle2: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontWeight: 400,
        fontStyle: 'normal',
      },
    },
    // body
    ...{
      body1: {
        fontFamily: [interFont.style.fontFamily, 'serif'].join(','),
        fontSize: '1.125rem',
      },
      body2: {
        fontFamily: [interFont.style.fontFamily, 'serif'].join(','),
        fontSize: '1.125rem',
      },
    },
    button: {
      fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
    },
    // image
    ...{
      caption: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontSize: '0.75rem',
        lineHeight: 1.2,
      },
    },
    // break block
    ...{
      blockBreakTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontWeight: 400,
        lineHeight: 1.3,
        textTransform: 'none',
        [breakpoints.up('xs')]: {
          fontStyle: 'normal',
        },
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 20,
              md: 32,
            },
          }),
        ]),
      },
      blockBreakBody: {
        fontFamily: [interFont.style.fontFamily, 'serif'].join(','),
      },
    },
    // BlockQuote
    ...{
      blockQuote: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        fontWeight: 400,
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.2,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 20,
              md: 30,
            },
          }),
        ]),
        '& + cite': {
          fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
          fontStyle: 'normal',
          textTransform: 'none',
          lineHeight: 1,
          fontWeight: 400,
          justifySelf: 'start',
          ...mergeDeepAll([
            responsiveProperty({
              cssProperty: 'fontSize',
              unit: 'rem',
              breakpoints: WePTheme.breakpoints.values,
              values: {
                xs: 14,
                md: 16,
              },
            }),
          ]),
        },
      },
    },
    // Footer
    ...{
      categoryLinkTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        color: colors.common.white,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        margin: 0,
        padding: '0 0.3rem',
        fontSize: '1.5rem',
        lineHeight: 1.2,
        fontWeight: 700,
        [breakpoints.up('md')]: {
          fontSize: '1.5rem',
          lineHeight: 1.2,
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
        fontWeight: 400,
        fontStyle: 'normal',
        lineHeight: 1.6,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'rem',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 16,
              md: 20,
            },
          }),
        ]),
      },
    },
    // TeaserSlots
    teaserSlotsTitle: {
      fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 400,
      color: colors.common.black,
      textTransform: 'none',
      textAlign: 'left',
      padding: 0,
      margin: 0,
      gridColumn: '-1 / 1',
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 24,
            md: 28,
          },
        }),
      ]),
    },
    // Teaser
    ...{
      teaserTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
        marginBottom: 0,
        textAlign: 'left',
        textTransform: 'none',
        fontWeight: 500,
        lineHeight: 1.3,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 24,
              md: 38,
            },
          }),
        ]),
      },
      teaserPretitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        color: colors.common.white,
        backgroundColor: colors.common.black,
        fontSize: '1rem',
        lineHeight: 1.2,
        fontWeight: 400,
        padding: '0.5rem 1rem',
        borderRadius: '3px',
        display: 'inline-block',
      },
      teaserLead: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        lineHeight: 1.5,
        fontWeight: 300,
        padding: 0,
        margin: 0,
        marginBottom: 0,
        backgroundColor: 'transparent',
        color: colors.common.black,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 16,
              md: 18,
            },
          }),
        ]),
      },
      teaserMeta: {
        fontFamily: ['Euclid', 'sans-serif'].join(','),
        backgroundColor: colors.common.white,
        margin: 0,
        fontSize: '1rem',
        fontWeight: 700,
        padding: '0 1.5rem',
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
          teaserSlotsTitle: 'h2',
          // author-list-item
          authorListItemName: 'h6',
          authorListItemBio: 'p',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.common.black,
          textDecorationColor: colors.common.black,
          textDecorationThickness: '1px',
          '&:hover': {
            textDecoration: 'underline',
            textDecorationColor: colors.common.black,
            textDecorationThickness: '2px',
          },
        },
      },
      variants: [
        {
          props: { variant: 'teaserTitleLink' },
          style: {
            [breakpoints.up('xs')]: {
              textDecoration: 'none',
              ['&:hover']: {
                textDecoration: 'none',
              },
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
        },
        {
          // Footer / Header
          props: { variant: 'categoryLink' },
          style: {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 500,
            fontStyle: 'normal',
            color: colors.common.white,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            padding: '0',
            textDecoration: 'none',
            lineHeight: 1.6,
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
            ...mergeDeepAll([
              responsiveProperty({
                cssProperty: 'fontSize',
                unit: 'rem',
                breakpoints: WePTheme.breakpoints.values,
                values: {
                  xs: 16,
                  md: 20,
                },
              }),
            ]),
          },
        },

        // Table of Contents - RichText
        {
          props: { variant: 'linkToc' },
          style: {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 700,
            lineHeight: 1,
            fontSize: '1.125rem',
            color: colors.common.white,
            textDecoration: 'none',
            textDecorationColor: colors.common.white,
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },

        // Downloads - CollapsibleRichText
        {
          props: { variant: 'linkDownloads' },
          style: {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 400,
            lineHeight: 1,
            fontSize: '1.125rem',
            color: colors.common.black,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
              textDecorationColor: colors.common.black,
              textDecorationThickness: '2px',
            },
          },
        },

        // Button-Links
        {
          props: { variant: 'buttonLinkMain' },
          style: {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 500,
            textTransform: 'uppercase',
            color: colors.common.black,
            backgroundColor: colors.secondary.light,
            padding: '0.5rem 1.5rem',
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: '1rem',
            lineHeight: 1.2,
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
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 500,
            textTransform: 'uppercase',
            borderRadius: '9999px',
            color: colors.common.white,
            backgroundColor: colors.common.black,
            padding: '0.5rem 1.5rem',
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: '1rem',
            lineHeight: 1.2,
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
            backgroundColor: 'transparent',
            borderRadius: 0,
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridTemplateRows: 'repeat(2, auto)',
            '&:before': {
              display: 'none',
            },
          },
          '.MuiAccordionSummary-root': {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 500,
            padding: '0',
            gridColumn: '-1 / 1',
            gridRow: '1 / 2',
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            textTransform: 'uppercase',
            fontSize: '1.5rem',
            '.MuiAccordionSummary-content': {
              gridColumn: '3 / 11',
              margin: '0',
              [breakpoints.up('md')]: {
                margin: '0 2rem',
              },
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
            gridColumn: '3 / 11',
            gridRow: '2 / 3',
            [breakpoints.up('md')]: {
              marginLeft: '2rem',
              marginRight: '2rem',
            },
            '.MuiCollapse-wrapper': {
              marginTop: '0.75rem',
            },
          },
          '.MuiAccordionDetails-root': {
            padding: '0',
            [breakpoints.up('md')]: {
              padding: '0 0 0 1rem',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            position: 'absolute',
            top: '50%',
            right: '1rem',
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
            paddingBottom: '1rem',
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
    MuiToolbar: {
      // set the navbar to be the same width as MuiContainer
      styleOverrides: {
        root: ({ theme }: { theme: any }) => ({
          ['&&']: {
            // since Appbar sets max width for Toolbar with specifity of 2...
            // ...we have to increase the specifity to override
            [theme.breakpoints.up('md')]: {
              maxWidth: `${breakPointValues.md + 48}px`,
            },
            [theme.breakpoints.up('lg')]: {
              maxWidth: `${breakPointValues.lg + 48}px`,
            },
            [theme.breakpoints.up('xl')]: {
              maxWidth: `${breakPointValues.xl + 48}px`,
            },
          },
        }),
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: colors.secondary.main,
          height: 4,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            backgroundColor: colors.common.white,
            border: `2px solid ${colors.common.black}`,
            '&:hover, &.Mui-focusVisible, &.Mui-active': {
              boxShadow: 'none',
            },
          },
          '& .MuiSlider-rail': {
            opacity: 0.5,
            backgroundColor: colors.common.black,
          },
          '& .MuiSlider-track': {
            backgroundColor: colors.common.black,
            opacity: 1,
          },
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const navbarTheme = createTheme(theme, {
  typography: {
    ...{
      categoryLinkList: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'row',
        columnGap: theme.spacing(1.5),
        gridColumn: '1 / 2',
        [breakpoints.up('md')]: {
          columnGap: theme.spacing(6),
          gridColumn: '3 / 4',
        },
        lineHeight: 1.2,
        pointerEvents: 'all',
      },
      categoryLinkItem: {
        listStyle: 'none',
        margin: 0,
        padding: '0 0',
        lineHeight: 0,
        borderRadius: '3px',
        ['&:last-of-type']: {
          display: 'none',
          [breakpoints.up('md')]: {
            display: 'block',
          },
          padding: '0 1rem',
          backgroundColor: colors.primary.light,
          ['&:hover']: {
            backgroundColor: colors.primary.light,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.4)',
          },
          ['& *:hover']: {
            textDecoration: 'none',
          },
        },
      },
    },
  },
  components: {
    MuiToolbar: {
      variants: [
        {
          props: { variant: 'navbarInnerWrapper' },
          style: ({ theme }: { theme: Theme }) => ({
            minHeight: 'unset',
            aspectRatio: 'var(--changing-aspect-ratio)',
            margin: '0 auto',
            width: '100%',
            backgroundColor: 'transparent',
            container: 'toolbar/inline-size',
            position: 'static',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: '1fr auto min-content',
            gridTemplateRows: 'repeat(2, auto)',
            transition:
              'background-color 100ms ease-out 200ms, aspect-ratio 300ms ease-out',
            ['&&']: {
              [theme.breakpoints.up('md')]: {
                gridTemplateRows: 'unset',
                maxWidth: `${breakPointValues.md + 48}px`,
              },
              [theme.breakpoints.up('lg')]: {
                maxWidth: `${breakPointValues.lg + 48}px`,
              },
              [theme.breakpoints.up('xl')]: {
                maxWidth: `${breakPointValues.xl + 48}px`,
              },
            },
          }),
        },
      ],
    },
    MuiLink: {
      variants: [
        // keep base variants
        ...(theme.components?.MuiLink?.variants ?? []),
        // add navbar-specific variants
        {
          props: { variant: 'categoryLink' },
          style: {
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            fontWeight: 400,
            fontStyle: 'normal',
            color: colors.common.black,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            padding: 0,
            textDecoration: 'none',
            lineHeight: 1.8,
            ['&:hover']: {
              textDecoration: 'underline',
            },
            ...mergeDeepAll([
              responsiveProperty({
                cssProperty: 'fontSize',
                unit: 'rem',
                breakpoints: WePTheme.breakpoints.values,
                values: {
                  xs: 16,
                  md: 18,
                },
              }),
            ]),
          },
        },
      ],
    },
  },
});

export const teaserNews = createTheme(theme, {
  typography: {
    ...{
      teaserTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
        marginBottom: 0,
        textAlign: 'left',
        textTransform: 'none',
        fontWeight: 500,
        lineHeight: 1.3,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 16,
              md: 24,
            },
          }),
        ]),
      },
      teaserMeta: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        margin: 0,
        color: alpha(theme.palette.common.black, 0.3),
        fontWeight: 400,
        padding: 0,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 12,
              md: 14,
            },
          }),
        ]),
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
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            display: 'inline',
            textDecoration: 'underline',
            flexGrow: 0,
            padding: 0,
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

export const teaserServices = createTheme(theme, {
  typography: {
    ...{
      teaserTitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
        marginBottom: 0,
        textAlign: 'left',
        textTransform: 'none',
        fontWeight: 500,
        lineHeight: 1.3,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 12,
              md: 24,
            },
          }),
        ]),
      },
      teaserPretitle: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        backgroundColor: 'transparent',
        lineHeight: 1.2,
        fontWeight: 400,
        padding: 0,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
      },
      teaserLead: {
        fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
        lineHeight: 1.5,
        fontWeight: 300,
        padding: 0,
        margin: 0,
        marginBottom: 0,
        backgroundColor: 'transparent',
        color: colors.common.black,
        ...mergeDeepAll([
          responsiveProperty({
            cssProperty: 'fontSize',
            unit: 'px',
            breakpoints: WePTheme.breakpoints.values,
            values: {
              xs: 12,
              md: 18,
            },
          }),
        ]),
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
            fontFamily: [interFont.style.fontFamily, 'sans-serif'].join(','),
            display: 'inline-block',
            textDecoration: 'none',
            flexGrow: 0,
            borderRadius: '3px',
            marginTop: '1rem',
            padding: '0.5rem 1.25rem',
            border: `1px solid ${colors.common.black}`,
            color: colors.common.black,
            '&:hover': {
              fontWeight: 500,
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.4)',
              textDecoration: 'none',
            },
          },
        },
      ],
    },
  },
});

export { theme as default };
