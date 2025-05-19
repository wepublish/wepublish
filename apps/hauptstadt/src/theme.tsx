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

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#abd8da'}}),
    secondary: augmentColor({color: {main: '#272727'}}),
    accent: augmentColor({color: {main: '#f3ded0'}})
  },
  typography: {
    h1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(',')
  }
} as PartialDeep<Theme> | ThemeOptions)

export const pageTheme = createTheme(theme, {} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
