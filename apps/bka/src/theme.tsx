import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import localFont from 'next/font/local';

export const Denim = localFont({
  src: [
    {
      path: '../public/fonts/denim/Denim-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/denim/Denim-RegularItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/denim/Denim-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});

export const DenimInk = localFont({
  src: [
    {
      path: '../public/fonts/denim/DenimINK-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});

export const bodyFontFamily = [
  Denim.style.fontFamily,
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(',');
export const displayFontFamily = [
  DenimInk.style.fontFamily,
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(',');

export const bkaTagFallbackColor = '#000000';

export const sidebarWidth = 204;

export const bkaThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: bodyFontFamily,
    allVariants: {
      fontFamily: bodyFontFamily,
      letterSpacing: 'normal',
    },
    h1: {
      fontFamily: displayFontFamily,
      fontWeight: 400,
      fontSize: '2.75rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: displayFontFamily,
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: displayFontFamily,
      fontWeight: 400,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h5: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1.375rem',
      lineHeight: 1.2,
    },
    h6: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },

    subtitle1: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1.625rem',
      lineHeight: 1.5,
    },

    body1: { fontFamily: bodyFontFamily, fontSize: '1rem', lineHeight: 1.5 },
    body2: {
      fontFamily: bodyFontFamily,
      fontSize: '0.875rem',
      lineHeight: 1.25,
    },

    teaserTitle: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1.375rem',
      lineHeight: 1.2,
      marginBottom: 0,
    },
    teaserPretitle: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.25,
    },
    teaserLead: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    teaserMeta: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.25,
    },
  },
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#ffffff' },
    secondary: { main: '#000000', contrastText: '#ffffff' },
    accent: { main: '#000000', light: '#000000', contrastText: '#ffffff' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#000000', secondary: '#000000' },
    grey: { 100: '#f2f2f2', 600: '#747474' },
    divider: '#000000',
  },
  shape: { borderRadius: 2 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#ffffff', color: '#000000' },
      },
    },
    MuiButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          minWidth: 0,
          padding: '0.375rem 1.75rem',
          border: '1px solid transparent',
          borderRadius: 4,
          fontFamily: bodyFontFamily,
          fontSize: '1.125rem',
          fontWeight: 700,
          lineHeight: 1.5,
          letterSpacing: 'normal',
          textAlign: 'center',
          textTransform: 'none',
          textDecoration: 'none',
          boxShadow: '0 0.0625em 0.25em rgba(0, 0, 0, 0.33)',
          '&:hover, &:focus': {
            textDecoration: 'none',
            boxShadow: '0 0.0625em 0.25em rgba(0, 0, 0, 0.33)',
          },
        },
        contained: {
          borderColor: '#000000',
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#4a4a4a', borderColor: '#4a4a4a' },
          '&:active': { backgroundColor: '#0f0f0f', borderColor: '#0f0f0f' },
        },
        outlined: {
          borderColor: 'currentcolor',
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: 'currentcolor',
            backgroundColor: 'transparent',
          },
        },
        text: {
          padding: 0,
          border: 0,
          fontWeight: 400,
          boxShadow: 'none',
          '&:hover, &:focus': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecorationColor: 'currentcolor',
          '&:hover, &:focus': { textDecoration: 'none' },
        },
      },
    },
  },
};

export const createBkaTheme = (settingsTheme?: unknown): Theme =>
  createTheme(
    minimalTheme,
    (settingsTheme as ThemeOptions | null | undefined) ?? {},
    bkaThemeOptions
  );

export default createBkaTheme();
