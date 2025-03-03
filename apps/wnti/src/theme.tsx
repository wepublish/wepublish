import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import localFont from 'next/font/local'
import {PartialDeep} from 'type-fest'

const Faro = localFont({
  src: [
    {
      path: './fonts/FaroWeb-DisplayLucky.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: './fonts/FaroWeb-SemiBoldLucky.woff2',
      weight: '600',
      style: 'normal'
    }
  ]
})

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#232524', light: '#F2BDB8', contrastText: '#FFF'}}),
    secondary: augmentColor({color: {main: '#FFEDEB', contrastText: '#000'}}),
    accent: augmentColor({color: {main: '#FFEDEB', contrastText: '#000'}})
  },
  typography: {
    h1: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: '600'
    },
    body2: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: '600'
    },
    button: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [Faro.style.fontFamily, 'sans-serif'].join(',')
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedSizeLarge: {
          padding: `${WePTheme.spacing(1.5)} ${WePTheme.spacing(3)}`,
          fontSize: '1.1em',
          color: '#000',
          backgroundColor: '#F2BDB8'
        },
        contained: {
          color: '#000',
          backgroundColor: '#F2BDB8 !important'
        },
        outlined: {
          color: '#F2BDB8',
          borderColor: '#F2BDB8'
        }
      }
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
