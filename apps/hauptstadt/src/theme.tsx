import {CSSObject} from '@emotion/react'
import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {createBreakpoints} from '@mui/system'
import {deepmerge} from '@mui/utils'
import {responsiveProperty, theme as WePTheme} from '@wepublish/ui'
import localFont from 'next/font/local'
import {PartialDeep} from 'type-fest'

const Tiempos = localFont({
  src: [
    {
      path: '../public/fonts/tiempos/tiempos-text-web-regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-regular-italic.woff2',
      weight: '400',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-medium-italic.woff2',
      weight: '500',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-semibold.woff2',
      weight: '600',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-semibold-italic.woff2',
      weight: '600',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/tiempos/tiempos-text-web-bold.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../public/fonts/tiempos/tiempos-text-web-bold-italic.woff2',
      weight: '800',
      style: 'italic'
    }
  ]
})

export const ABCWhyte = localFont({
  src: [
    {
      path: '../public/fonts/abc-white/ABCWhyte-Thin.woff2',
      weight: '100',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-ThinItalic.woff2',
      weight: '100',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Light.woff2',
      weight: '200',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-LightItalic.woff2',
      weight: '200',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Book.woff2',
      weight: '300',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-BookItalic.woff2',
      weight: '300',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Regular.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-RegularItalic.woff2',
      weight: '400',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Medium.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-MediumItalic.woff2',
      weight: '500',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Bold.woff2',
      weight: '800',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-BoldItalic.woff2',
      weight: '800',
      style: 'italic'
    },
    //
    {
      path: '../public/fonts/abc-white/ABCWhyte-Super.woff2',
      weight: '900',
      style: 'normal'
    },
    {
      path: '../public/fonts/abc-white/ABCWhyte-SuperItalic.woff2',
      weight: '900',
      style: 'italic'
    }
  ]
})

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xxl: true
  }
}

const {
  palette: {augmentColor}
} = WePTheme

const variablesTheme = createTheme(WePTheme, {
  breakpoints: createBreakpoints({
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1080,
      xl: 1464,
      xxl: 2100
    }
  }),
  palette: {
    primary: augmentColor({color: {main: '#abd8da'}}),
    secondary: augmentColor({color: {main: '#272727'}}),
    accent: augmentColor({color: {main: '#f3ded0'}}),
    success: augmentColor({color: {main: '#abd8da'}}),
    warning: augmentColor({color: {main: '#f4e7bd'}})
  }
} as PartialDeep<Theme> | ThemeOptions)

const caption = {
  ...variablesTheme.typography.caption,
  lineHeight: 1.3,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: variablesTheme.breakpoints.values,
    values: {
      xs: 14,
      md: 16
    }
  })
}

const body = {
  ...variablesTheme.typography.body1,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.6,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: variablesTheme.breakpoints.values,
    values: {
      xs: 17,
      md: 18
    }
  })
}

const h3 = {
  ...variablesTheme.typography.h3,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: variablesTheme.breakpoints.values,
    values: {
      xs: 30,
      md: 46
    }
  })
}

const h4 = {
  ...variablesTheme.typography.h4,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: variablesTheme.breakpoints.values,
    values: {
      xs: 24
    }
  })
}

const h5 = {
  ...variablesTheme.typography.h5,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2
}

const subtitle1 = {
  ...variablesTheme.typography.subtitle1,
  fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.35,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: variablesTheme.breakpoints.values,
    values: {
      xs: 20,
      md: 26
    }
  })
}

const theme = createTheme(variablesTheme, {
  typography: {
    fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
    allVariants: {
      lineHeight: 1.25,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(',')
    },
    h1: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h2: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h3,
    h4,
    h5,
    h6: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    body1: body,
    body2: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.25
    },
    caption,
    overline: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    subtitle1,
    subtitle2: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    button: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(',')
    },
    //Article
    articleAuthors: caption,
    // Blocks
    blockBreakTitle: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      textTransform: 'unset',
      lineHeight: 1.2,
      ...deepmerge(
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: variablesTheme.breakpoints.values,
          values: {
            xs: 22,
            md: 22
          }
        }),
        {
          [variablesTheme.breakpoints.up('md')]: {
            fontStyle: 'unset'
          }
        }
      )
    },
    blockBreakBody: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 200,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 15,
          md: 15
        }
      })
    },
    // Teaser
    teaserTitle: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 20,
          md: 20, // to override base theme
          lg: 22,
          xl: 24,
          xxl: 39
        }
      }),
      ...responsiveProperty({
        cssProperty: 'marginBottom',
        unit: 'px',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 8,
          xl: 16,
          xxl: 36
        }
      })
    },
    teaserLead: {
      lineHeight: 1.25,
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 14,
          lg: 16,
          xl: 17,
          xxl: 26
        }
      }),
      ...responsiveProperty({
        cssProperty: 'marginBottom',
        unit: 'px',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 12,
          xl: 16,
          xxl: 36
        }
      })
    },
    teaserMeta: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 10,
          xl: 13,
          xxl: 18
        }
      })
    },
    teaserPretitle: {
      transform: 'unset',
      padding: `0 ${variablesTheme.spacing(0.5)}`,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.5,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 15,
          md: 16
        }
      })
    },
    //
    bannerTitle: {
      ...h5,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 24,
          lg: 28,
          xl: 32
        }
      })
    },
    bannerText: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 200,
      lineHeight: 1.35,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 16,
          lg: 18,
          xl: 21
        }
      })
    },
    bannerCta: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 800,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 20,
          sm: 23,
          md: 25
        }
      })
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'large'
      },
      styleOverrides: {
        sizeLarge: ({theme}) => ({
          fontSize: '14px',
          padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
          [theme.breakpoints.up('md')]: {
            padding: `${theme.spacing(1.5)} ${theme.spacing(2.5)}`
          }
        }),
        containedSizeLarge: {
          border: '1px solid transparent'
        },
        textPrimary: {
          color: '#587072'
        },
        contained: {
          borderRadius: '4px',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: '0.0892857143em'
        },
        outlined: {
          borderRadius: '4px',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: '0.0892857143em',
          ['&, &:hover']: {
            borderWidth: '1px'
          }
        },
        outlinedPrimary: ({theme}) => ({
          ['&, &&:hover']: {
            color: theme.palette.primary.dark,
            borderColor: theme.palette.primary.dark
          }
        }),
        outlinedSecondary: ({theme}) => ({
          color: theme.palette.secondary.main
        }),
        text: {
          borderRadius: '4px'
        }
      }
    },
    MuiLink: {
      defaultProps: {
        underline: 'always'
      },
      styleOverrides: {
        root: ({ownerState, theme}) => {
          const styles = {} as CSSObject

          if (ownerState.underline !== 'none') {
            styles.textDecoration = 'underline'
          }

          if (ownerState.color === 'primary') {
            styles.color = '#587072'
          }

          return styles
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: ({theme}) => ({
          display: 'grid',
          gap: theme.spacing(5),
          maxWidth: '492px',
          [theme.breakpoints.up('md')]: {
            maxWidth: '868px',
            gap: theme.spacing(10)
          },
          [theme.breakpoints.up('lg')]: {
            maxWidth: '1080px'
          },
          [theme.breakpoints.up('xl')]: {
            maxWidth: '1425px'
          },
          [theme.breakpoints.up('xxl')]: {
            maxWidth: '2100px'
          }
        })
      }
    }
  }
} as ThemeOptions)

export const alternatingTeaserTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      ...deepmerge(
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: variablesTheme.breakpoints.values,
          values: {
            xs: 24,
            md: 32, // to override base theme
            lg: 32,
            xl: 40,
            xxl: 58
          }
        }),
        responsiveProperty({
          cssProperty: 'marginBottom',
          unit: 'px',
          breakpoints: variablesTheme.breakpoints.values,
          values: {
            xs: 8,
            md: 16,
            lg: 24,
            xl: 24, // to override normal teaser theme
            xxl: 48
          }
        })
      )
    },
    teaserLead: {
      lineHeight: 1.25,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 16,
          lg: 21,
          xl: 23,
          xxl: 36
        }
      })
    },
    teaserMeta: {
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 12,
          lg: 14,
          xl: 15,
          xxl: 20
        }
      })
    },
    teaserPretitle: {
      padding: `${variablesTheme.spacing(0.5)} ${variablesTheme.spacing(2)}`,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        unit: 'rem',
        breakpoints: variablesTheme.breakpoints.values,
        values: {
          xs: 16,
          lg: 19,
          xl: 20,
          xxl: 27
        }
      })
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
