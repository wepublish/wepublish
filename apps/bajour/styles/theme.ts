import {createTheme} from '@mui/material'

const {
  palette: {augmentColor}
} = createTheme()

const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
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
      xl: 3800
    }
  },
  palette: {
    primary: augmentColor({color: {main: '#FDDDD2'}}),
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
