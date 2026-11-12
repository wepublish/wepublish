import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { alpha, createBreakpoints } from '@mui/system';
import { responsiveProperty, theme as WePTheme } from '@wepublish/ui';
import { Archivo, Bricolage_Grotesque, Space_Mono } from 'next/font/google';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

const mergeDeepAll = reduce(mergeDeepRight, {});

// Typefaces from the Figma design (file "Website", frame "Fonts")
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const headingFont = [bricolageGrotesque.style.fontFamily, 'sans-serif'].join(
  ','
);
const bodyFont = [archivo.style.fontFamily, 'sans-serif'].join(',');
const monoFont = [spaceMono.style.fontFamily, 'monospace'].join(',');

const breakPointValues = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1133,
  xl: 1133,
  xxl: 1133,
};

// Text styles of the Figma design. All sizes are scaled down by 20/22 so that
// Text is 1.25rem on desktop. The design only has desktop sizes (lg and up);
// md is a step between them and the mobile sizes (xs). The title gets one more
// step for tablets (sm).
const textStyle = (
  fontFamily: string,
  fontWeight: number,
  lineHeight: number,
  fontSizes: { xs: number; sm?: number; md: number; lg: number }
) => ({
  fontFamily,
  fontWeight,
  lineHeight,
  letterSpacing: 0,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: breakPointValues,
    values: fontSizes,
  }),
});

export const designText = {
  h1: textStyle(headingFont, 800, 1.2, { xs: 33, sm: 40, md: 46, lg: 60 }),
  h2: textStyle(headingFont, 800, 1.3, { xs: 25, md: 34, lg: 42 }),
  h3: textStyle(headingFont, 600, 1.3, { xs: 22, md: 26, lg: 29 }),
  h4: textStyle(headingFont, 600, 1.3, { xs: 18, md: 20, lg: 22 }),
  paragraph: textStyle(bodyFont, 400, 1.5, { xs: 18, md: 22, lg: 27 }),
  text: textStyle(bodyFont, 400, 1.5, { xs: 16, md: 18, lg: 20 }),
  textSmallMono: textStyle(monoFont, 400, 1.5, { xs: 15, md: 16, lg: 16 }),
};

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
        ...designText.h1,
        textTransform: 'none',
      },
      h2: {
        ...designText.h2,
        textTransform: 'none',
      },
      h3: {
        ...designText.h3,
        textTransform: 'none',
      },
      h4: {
        ...designText.h4,
        textTransform: 'none',
      },
      h5: {
        fontFamily: headingFont,
        fontWeight: 700,
        fontSize: '1.125rem',
      },
      h6: {
        fontFamily: headingFont,
      },
      blockTitlePreTitle: {
        ...designText.text,
        backgroundColor: 'transparent',
        padding: 0,
      },
      subtitle1: {
        ...designText.paragraph,
        fontStyle: 'normal',
      },
      subtitle2: {
        ...designText.paragraph,
        fontStyle: 'normal',
      },
    },
    // body
    ...{
      body1: designText.text,
      body2: designText.text,
    },
    button: {
      fontFamily: bodyFont,
    },
    overline: {
      fontFamily: bodyFont,
    },
    // image
    ...{
      caption: {
        fontFamily: bodyFont,
        fontSize: '0.75rem',
        lineHeight: 1.2,
      },
    },
    // break block
    ...{
      blockBreakTitle: {
        ...designText.h2,
        textTransform: 'none',
        [breakpoints.up('xs')]: {
          fontStyle: 'normal',
        },
      },
      blockBreakBody: designText.paragraph,
    },
    // BlockQuote
    ...{
      blockQuote: {
        ...designText.h3,
        fontStyle: 'normal',
        textAlign: 'left',
        '& + cite': {
          ...designText.text,
          fontStyle: 'normal',
          textTransform: 'none',
          justifySelf: 'start',
        },
      },
    },
    // Footer
    ...{
      categoryLinkTitle: {
        ...designText.textSmallMono,
        color: colors.common.white,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        margin: 0,
        padding: '0 0.3rem',
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
        ...designText.text,
        color: colors.common.white,
        fontStyle: 'normal',
      },
    },
    // TeaserSlots
    teaserSlotsTitle: {
      fontFamily: headingFont,
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
        fontFamily: headingFont,
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
        fontFamily: bodyFont,
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
        fontFamily: bodyFont,
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
        ...designText.textSmallMono,
        backgroundColor: colors.common.white,
        margin: 0,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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

export const teaserNews = createTheme(theme, {
  typography: {
    ...{
      teaserTitle: {
        fontFamily: headingFont,
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
        ...designText.textSmallMono,
        backgroundColor: 'transparent',
        margin: 0,
        color: alpha(theme.palette.common.black, 0.3),
        padding: 0,
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
            fontFamily: bodyFont,
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
        fontFamily: headingFont,
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
        fontFamily: bodyFont,
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
        fontFamily: bodyFont,
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
            fontFamily: bodyFont,
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
