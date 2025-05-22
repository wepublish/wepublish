import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import localFont from 'next/font/local'
import {PartialDeep} from 'type-fest'

const Tiempos = localFont({
  src: [
    {
      path: '../public/fonts/tiempos/tiempos-text-web-regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-regular-italic.woff2',
      weight: '400',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-medium-italic.woff2',
      weight: '500',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-semibold.woff2',
      weight: '600',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-semibold-italic.woff2',
      weight: '600',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-bold.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-bold-italic.woff2',
      weight: '800',
      style: 'italic'
    }
  ]
})

export const ABCWhyte = localFont({
  src: [
    {
      path: '../public/fonts/abc-white/ABCWhyte-Thin.woff2',
      weight: '200',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-ThinItalic.woff2',
      weight: '200',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Book.woff2',
      weight: '300',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-BookItalic.woff2',
      weight: '300',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-RegularItalic.woff2',
      weight: '400',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-MediumItalic.woff2',
      weight: '500',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Bold.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-BoldItalic.woff2',
      weight: '800',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Super.woff2',
      weight: '900',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-SuperItalic.woff2',
      weight: '900',
      style: 'italic'
    }
  ]
})

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#abd8da'}}),
    secondary: augmentColor({color: {main: '#272727'}}),
    accent: augmentColor({color: {main: '#f3ded0'}}),
    success: augmentColor({color: {main: '#abd8da'}}),
    warning: augmentColor({color: {main: '#f4e7bd'}})
  },
  typography: {
    allVariants: {
      lineHeight: 1.25,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(',')
    },
    h1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h3: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h4: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h5: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h6: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    body1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.25
    },
    body2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.25
    },
    button: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    overline: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    subtitle1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    subtitle2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1088
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export const articleTheme = createTheme(theme, {
  breakpoints: WePTheme.breakpoints.values
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
