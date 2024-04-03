import {createTheme} from '@mui/material'

export const theme = createTheme({
  typography: {
    fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
    h4: {
      fontWeight: '600',
      fontSize: '26px',
      '@media (min-width:900px)': {
        fontSize: '32px'
      }
    }
  },
  palette: {
    primary: {
      main: '#e91e63'
    },
    secondary: {
      main: '#000',
      contrastText: '#fff'
    },
    grey: {
      800: '#1a1a1a'
    }
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: ({ownerState}) => ({
          ...(ownerState.color === 'secondary' && {
            color: '#fff'
          })
        })
      }
    }
  }
})
