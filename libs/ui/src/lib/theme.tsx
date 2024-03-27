import {CSSObject, createTheme} from '@mui/material'
import {BorderRadius} from '../../editor/src/lib/atoms/helpers'

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
    MuiButton: {
      styleOverrides: {
        root: ({ownerState, theme}) => {
          const baseStyles: CSSObject = {
            borderRadius: '30px',
            textTransform: 'initial',
            boxShadow: 'none'
          }

          if (ownerState.color === 'secondary') {
            if (ownerState.variant === 'outlined') {
              return {
                ...baseStyles,
                color: theme.palette.common.white,
                borderColor: 'currentcolor',
                borderWidth: '2px',
                ':hover': {
                  borderWidth: '2px',
                  borderColor: 'currentcolor'
                }
              }
            }

            if (ownerState.variant === 'contained') {
              return {
                ...baseStyles,
                fontWeight: 700,
                backgroundColor: theme.palette.common.white,
                color: theme.palette.common.black,
                ':hover': {
                  backgroundColor: theme.palette.common.white,
                  boxShadow: 'none'
                }
              }
            }
          }
        }
      }
    }
  }
})
