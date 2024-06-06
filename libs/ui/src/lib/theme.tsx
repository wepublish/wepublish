import {createTheme, CSSObject, SimplePaletteColorOptions} from '@mui/material'
import {createBreakpoints} from '@mui/system'

const {
  palette: {augmentColor},
  breakpoints: originalBreakpoints
} = createTheme()

declare module '@mui/material/styles' {
  interface Palette {
    accent: SimplePaletteColorOptions
  }

  interface PaletteOptions {
    accent: SimplePaletteColorOptions
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true
  }
}

export const theme = createTheme({
  typography: {
    allVariants: {
      lineHeight: 1.4
    },
    h1: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600,
      lineHeight: 1.15
    },
    h2: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600,
      lineHeight: 1.15
    },
    h3: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600,
      lineHeight: 1.15
    },
    h4: {
      fontFamily: ['Hanken Grotesk', 'Roboto', 'sans-serif'].join(','),
      fontWeight: 600,
      lineHeight: 1.15,
      fontSize: '26px',
      '@media (min-width: 900px)': {
        fontSize: '32px'
      }
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
    primary: augmentColor({color: {main: '#e91e63'}}),
    secondary: augmentColor({color: {main: '#000'}}),
    accent: augmentColor({color: {main: '#F5FF64', light: '#A4EFEF'}}),
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
            boxShadow: 'none',
            ':hover': {
              boxShadow: 'none'
            }
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

          if (ownerState.variant === 'contained') {
            return {
              ...baseStyles,
              fontWeight: 700
            }
          }

          return baseStyles
        }
      }
    },
    MuiInputAdornment: {
      styleOverrides: {
        positionStart: {
          flexShrink: 0
        }
      }
    }
  },
  breakpoints: createBreakpoints({
    values: {
      ...originalBreakpoints.values,
      lg: 1333
    }
  })
})
