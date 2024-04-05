import {createTheme} from '@mui/material'

const {
  palette: {augmentColor}
} = createTheme()

import {theme as WePTheme} from "@wepublish/ui"

const theme = createTheme(WePTheme, {
  typography: {
    fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
    body1: {
      lineHeight: 1.25
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 700,
      md: 960,
      lg: 1280,
      xl: 1600
    }
  },
  palette: {
    primary: augmentColor({color: {main: '#FF006B'}}), // pink e.g. header
    secondary: augmentColor({color: {main: '#F5FF64'}}), // green e.g. banner
    info: augmentColor({color: {main: '#7FFAB6'}}), // yellow e.g. details
    error: augmentColor({color: {main: '#FF0D62'}})
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px'
        },
        outlinedError: {
          borderWidth: '3px',
          borderColor: '#FF0D62',
          fontWeight: 'bold',
          ':hover': {
            borderWidth: '3px'
          }
        }
      }
    }
  }
})

export default theme
