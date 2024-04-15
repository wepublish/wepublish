import {createTheme, ThemeOptions} from '@mui/material'
import {createBreakpoints} from '@mui/system'
import {theme as WepTheme} from '@wepublish/ui'

const {
  palette: {augmentColor}
} = createTheme()

const theme = createTheme(WepTheme, {
  typography: {
    fontFamily: 'Roboto, sans-serif'
  },
  breakpoints: createBreakpoints({
    values: {
      xs: 0,
      sm: 700,
      md: 960,
      lg: 1280,
      xl: 3800
    }
  }),
  palette: {
    primary: augmentColor({color: {main: '#FF0D62'}}),
    secondary: augmentColor({color: {main: '#FDDDD2', dark: '#ffbaba'}}),
    error: augmentColor({color: {main: '#FF0D62'}})
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlinedPrimary: {
          borderWidth: '3px',
          borderColor: '#FF0D62',
          fontWeight: 'bold',
          ':hover': {
            backgroundColor: 'transparent',
            borderWidth: '3px'
          }
        }
      }
    }
  }
} as ThemeOptions)

export const navbarTheme = createTheme(theme, {
  palette: {
    primary: theme.palette.secondary
  }
} as ThemeOptions)

export default theme
