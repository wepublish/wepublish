import {createTheme} from '@mui/material'

export const theme = createTheme({
  typography: {
    fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
    h4: {
      fontSize: '32px',
      fontWeight: 'bold'
    },
    h6: {
      fontSize: '20px',
      fontWeight: 'bold'
    }
  },
  palette: {
    secondary: {
      main: '#000',
      contrastText: '#fff'
    },
    background: {
      paper: '#e91e63'
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
