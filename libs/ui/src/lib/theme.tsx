import {createTheme} from '@mui/material'

export const theme = createTheme({
  typography: {
    allVariants: {
      lineHeight: 1.4
    },
    h1: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600
    },
    h2: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600
    },
    h3: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600
    },
    h4: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600
    },
    h5: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600
    },
    h6: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 300
    },
    body1: {
      lineHeight: 1.7
    },
    fontFamily: ['Merriweather', 'Roboto', 'sans-serif'].join(',')
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
