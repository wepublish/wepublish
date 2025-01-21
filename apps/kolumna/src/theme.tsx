import {createTheme, CSSObject, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {PT_Serif, Schibsted_Grotesk} from 'next/font/google'
import {lighten} from 'polished'

const headerText = Schibsted_Grotesk({
  weight: ['400', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const bodyText = PT_Serif({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const {
  palette: {augmentColor}
} = WePTheme

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#00B1AE'}}),
    secondary: augmentColor({color: {main: '#826AA9'}}),
    accent: augmentColor({color: {main: '#E2B322', light: '#FEF886'}}),
    background: {
      default: '#f8f7fa' //transparentize(0.95, '#826AA9')
    }
  },
  typography: {
    h1: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h2: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h3: {
      fontSize: '2rem',
      '@media (min-width: 900px)': {
        fontSize: '2.5rem'
      },
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h4: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h5: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    h6: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    body1: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    caption: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    overline: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle1: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    subtitle2: {
      fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [headerText.style.fontFamily, 'sans-serif'].join(',')
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ownerState, theme}) => {
          const baseStyles: CSSObject = {
            borderRadius: '3px',
            textTransform: 'initial',
            boxShadow: 'none',
            ':hover': {
              boxShadow: 'none'
            }
          }

          if (ownerState.color === 'primary') {
            if (ownerState.variant === 'contained') {
              return {
                ...baseStyles,
                fontWeight: 700,
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.getContrastText(theme.palette.secondary.main),
                ':hover': {
                  backgroundColor: theme.palette.secondary.light,
                  boxShadow: 'none'
                }
              }
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
                backgroundColor: theme.palette.accent.light,
                color: theme.palette.secondary.main,
                ':hover': {
                  backgroundColor: lighten(0.05, theme.palette.accent.light!),
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
    }
  }
} satisfies ThemeOptions)

export const navbarTheme = createTheme(theme, {
  palette: {
    primary: theme.palette.accent
  }
} as ThemeOptions)

export const articleTheme = createTheme(theme, {
  typography: {
    body1: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    body2: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    button: {
      fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
    },
    fontFamily: [bodyText.style.fontFamily, 'sans-serif'].join(',')
  }
} as ThemeOptions)

export {theme as default}
