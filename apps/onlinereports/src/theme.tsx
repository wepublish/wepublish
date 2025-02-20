import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {Inter, Lora} from 'next/font/google'
import {PartialDeep} from 'type-fest'

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const lora = Lora({
  weight: ['600'],
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
      primary: '#141414',
      secondary: '#10243A'
    },
    primary: {
      // main: '#E1190F',
      contrastText: '#fff'
    },
    secondary: {
      main: '#89B9DC',
      contrastText: '#10243A'
    }
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
      fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 300
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
      fontFamily: [lora.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [inter.style.fontFamily, 'sans-serif'].join(',')
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none'
        }
      }
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
