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

const {
  palette: {augmentColor}
} = WePTheme

const variablesTheme = createTheme(WePTheme, {
  breakpoints: createBreakpoints({
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1088,
      xl: 1088
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
    max: 16,
    min: 14,
    unit: 'rem',
    breakpoints: [variablesTheme.breakpoints.values.md]
  })
}

const body = {
  ...variablesTheme.typography.body1,
  fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.6,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    max: 18,
    min: 17,
    unit: 'rem',
    breakpoints: [variablesTheme.breakpoints.values.md]
  })
}

const h3 = {
  ...variablesTheme.typography.h3,
  fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    max: 46,
    min: 30,
    unit: 'rem',
    breakpoints: [variablesTheme.breakpoints.values.md]
  })
}

const h4 = {
  ...variablesTheme.typography.h4,
  fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    max: 24,
    min: 24,
    unit: 'rem',
    breakpoints: []
  })
}

const h5 = {
  ...variablesTheme.typography.h5,
  fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.2
}

const subtitle1 = {
  ...variablesTheme.typography.subtitle1,
  fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
  lineHeight: 1.35,
  ...responsiveProperty({
    cssProperty: 'fontSize',
    max: 26,
    min: 20,
    unit: 'rem',
    breakpoints: [variablesTheme.breakpoints.values.md]
  })
}

const theme = createTheme(variablesTheme, {
  typography: {
    fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
    allVariants: {
      lineHeight: 1.25,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(',')
    },
    h1: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    h3,
    h4,
    h5,
    h6: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.2
    },
    body1: body,
    body2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.25
    },
    caption,
    overline: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    subtitle1,
    subtitle2: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.3
    },
    button: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(',')
    },
    //Article
    articleAuthors: caption,
    // Teaser
    teaserTitle: {
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 22,
        min: 20,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      }),
      marginBottom: '8px'
    },
    teaserLead: {
      lineHeight: 1.25,
      fontFamily: [Tiempos.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 16,
        min: 14,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      })
    },
    teaserMeta: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 10,
        min: 10,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      })
    },
    teaserPretitle: {
      transform: 'unset',
      padding: `0 ${variablesTheme.spacing(0.5)}`,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      lineHeight: 1.5,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 16,
        min: 15,
        unit: 'rem',
        breakpoints: [variablesTheme.breakpoints.values.md]
      })
    },
    //
    bannerTitle: {
      ...h5,
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 28,
        min: 24,
        unit: 'rem',
        breakpoints: [variablesTheme.breakpoints.values.md]
      })
    },
    bannerText: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 200,
      lineHeight: 1.35,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 18,
        min: 16,
        unit: 'rem',
        breakpoints: [variablesTheme.breakpoints.values.md]
      })
    },
    bannerCta: {
      fontFamily: [ABCWhyte.style.fontFamily, 'sans-serif'].join(','),
      fontWeight: 800,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 23,
        min: 20,
        unit: 'rem',
        breakpoints: [variablesTheme.breakpoints.values.md]
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
    }
  }
} as ThemeOptions)

export const alternatingTeaserTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      ...deepmerge(
        responsiveProperty({
          cssProperty: 'fontSize',
          max: 32,
          min: 24,
          unit: 'rem',
          breakpoints: Object.values(variablesTheme.breakpoints.values)
        }),
        responsiveProperty({
          cssProperty: 'marginBottom',
          max: 24,
          min: 8,
          unit: 'px',
          breakpoints: Object.values(variablesTheme.breakpoints.values)
        })
      )
    },
    teaserLead: {
      lineHeight: 1.25,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 21,
        min: 16,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      })
    },
    teaserMeta: {
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 14,
        min: 12,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      })
    },
    teaserPretitle: {
      padding: `${variablesTheme.spacing(0.5)} ${variablesTheme.spacing(2)}`,
      ...responsiveProperty({
        cssProperty: 'fontSize',
        max: 20,
        min: 16,
        unit: 'rem',
        breakpoints: Object.values(variablesTheme.breakpoints.values)
      })
    }
  }
} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
