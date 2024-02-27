import {createTheme} from '@mui/material'

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
    primary: {
      main: '#FDDDD2' // light orange
    },
    secondary: {
      main: '#FF0D62' // bajour pink
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px'
        }
      }
    }
  }
})
export default theme
