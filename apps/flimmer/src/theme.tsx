import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {Hanken_Grotesk} from 'next/font/google'
import {PartialDeep} from 'type-fest'

const hankenGrotesk = Hanken_Grotesk({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#000000'}}),
    secondary: augmentColor({color: {main: '#000000'}}),
    accent: augmentColor({color: {main: '#FF00AC'}}),
    background: augmentColor({color: {main: '#FFFAEF'}})
  },
  typography: {
    h1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(','),
      fontSize: '16px'
    },
    body2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [hankenGrotesk.style.fontFamily, 'sans-serif'].join(',')
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedSizeLarge: () => ({
          padding: `${WePTheme.spacing(1.5)} ${WePTheme.spacing(3)}`,
          fontSize: '1.1em'
        })
      }
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
