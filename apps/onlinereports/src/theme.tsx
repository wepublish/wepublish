import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {Inter} from 'next/font/google'
import {PartialDeep} from 'type-fest'

const inter = Inter({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const {
  palette: {augmentColor},
  breakpoints
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    text: {
      primary: '#10243A'
    },
    primary: augmentColor({color: {main: '#89B9DC', light: '#89B9DC', contrastText: '#10243A'}}),
    accent: augmentColor({
      color: {
        main: '#nnn',
        contrastText: '#E1190F'
      }
    })
  },
  typography: {
    h1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '24px',
      [breakpoints.up('md')]: {
        fontSize: '36px'
      }
    },
    h4: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
