import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {Gentium_Book_Plus, Kumbh_Sans} from 'next/font/google'
import {PartialDeep} from 'type-fest'

const gentiumBookPlus = Gentium_Book_Plus({
  weight: ['400', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const kumbhSans = Kumbh_Sans({
  weight: ['100', '300', '400', '500', '600', '700'],
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
    primary: augmentColor({color: {main: '#826AA9'}}),
    secondary: augmentColor({color: {main: '#00B1AE'}}),
    accent: augmentColor({color: {main: '#E2B322', light: '#FEF886'}})
  },
  typography: {
    h1: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [kumbhSans.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [kumbhSans.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [kumbhSans.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [gentiumBookPlus.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [kumbhSans.style.fontFamily, 'sans-serif'].join(',')
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
