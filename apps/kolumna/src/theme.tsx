import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {PT_Serif, Schibsted_Grotesk} from 'next/font/google'
import {PartialDeep} from 'type-fest'

const heaerText = Schibsted_Grotesk({
  weight: ['400', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const bodyText = PT_Serif({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#00B1AE'}}),
    secondary: augmentColor({color: {main: '#826AA9'}}),
    accent: augmentColor({color: {main: '#E2B322', light: '#FEF886'}})
  },
  typography: {
    h1: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [heaerText.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
  }
} as PartialDeep<Theme> | ThemeOptions)

export const navbarTheme = createTheme(theme, {
  palette: {
    primary: theme.palette.accent
  }
} as ThemeOptions)

export {theme as default}
