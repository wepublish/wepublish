import { CSSObject } from '@emotion/react';
import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { responsiveProperty, theme as WePTheme } from '@wepublish/ui';
import localFont from 'next/font/local';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

export const gtSuperText = localFont({
  src: [
    {
      path: '../public/fonts/gt-super-text/GT-Super-Text-Book.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/gt-super-text/GT-Super-Text-Book-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    //
    {
      path: '../public/fonts/gt-super-text/GT-Super-Text-Bold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
});

export const fffAcidGrotesk = localFont({
  src: [
    {
      path: '../public/fonts/fff-acid-grotesk/FFF-AcidGrotesk-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
});

const {
  palette: { augmentColor },
} = WePTheme;

const mergeDeepAll = reduce(mergeDeepRight, {});

const fontSmall = mergeDeepAll([
  responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 12,
      md: 16,
    },
  }),
  responsiveProperty({
    cssProperty: 'lineHeight',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 16,
      md: 22,
    },
  }),
  responsiveProperty({
    cssProperty: 'letterSpacing',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 0.5,
      md: 0.8,
    },
  }),
]);

const titleBlock = {
  fontFamily: [fffAcidGrotesk.style.fontFamily, 'sans-serif'].join(','),
  fontWeight: 400,
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 32,
        md: 60,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 36,
        md: 68,
      },
    }),
    responsiveProperty({
      cssProperty: 'letterSpacing',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 1,
        md: 0.6,
      },
    }),
  ]),
};

const lead = {
  fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 19,
        md: 25,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 24,
        md: 30,
      },
    }),
  ]),
};

const paragraph = {
  fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
  letterSpacing: 0.1,
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 17,
        md: 20,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 24,
        md: 28,
      },
    }),
  ]),
};

const theme = createTheme(WePTheme, {
  typography: {
    h1: titleBlock,
    h2: titleBlock,
    h3: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      ...paragraph,
      fontWeight: 600,
    },
    h6: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: paragraph,
    body2: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      ...fontSmall,
      fontFamily: [fffAcidGrotesk.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 400,
      letterSpacing: 0.8,
    },
    caption: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: lead,
    subtitle2: {
      fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
    },
    articleAuthors: {
      ...fontSmall,
      fontFamily: [fffAcidGrotesk.style.fontFamily, 'sans-serif'].join(','),
    },
    fontFamily: [gtSuperText.style.fontFamily, 'sans-serif'].join(','),
  },
  palette: {
    primary: augmentColor({
      color: { light: '#64DDB0', main: '#21CE8E', dark: '#179063' },
    }),
    secondary: augmentColor({
      color: { light: '#FE97B6', main: '#FD6A96', dark: '#B14A69' },
    }),
    accent: augmentColor({
      color: { light: '#F3FF97', main: '#EEFF6A', dark: '#E0F159' },
    }),
    error: augmentColor({
      color: { light: '#F06D4B', main: '#EC491E', dark: '#BD3A18' },
    }),
    warning: augmentColor({
      color: { light: '#A54DD8', main: '#8E21CE', dark: '#631790' },
    }),
    info: augmentColor({
      color: { light: '#92D2F1', main: '#63BEEB', dark: '#4F98BC' },
    }),
    success: augmentColor({
      color: { light: '#64DDB0', main: '#21CE8E', dark: '#179063' },
    }),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const baseStyles: CSSObject = {
            ...((WePTheme.components?.MuiButton?.styleOverrides?.root as any)?.(
              {
                ownerState,
                theme,
              }
            ) ?? {}),
            fontWeight: undefined,
          };

          if (ownerState.color === 'secondary') {
            if (ownerState.variant === 'outlined') {
              return {
                ...baseStyles,
                color: theme.palette.common.black,
              };
            }
          }

          return baseStyles;
        },
      },
    },
  } as ThemeOptions['components'],
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
