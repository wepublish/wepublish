import { SerializedStyles } from '@emotion/react';
import {
  createTheme,
  CSSObject,
  SimplePaletteColorOptions,
  Theme as MaterialTheme,
} from '@mui/material';
import { TypographyStyleOptions } from '@mui/material/styles/createTypography';
import {
  Breakpoint,
  createBreakpoints,
  CSSInterpolation,
  Theme,
  ThemeProvider,
} from '@mui/system';
import { ComponentType, memo } from 'react';

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends MaterialTheme {}

  export function css(
    template: TemplateStringsArray,
    ...args: Array<CSSInterpolation | TypographyStyleOptions | undefined>
  ): SerializedStyles;
  export function css(
    ...args: Array<CSSInterpolation | TypographyStyleOptions | undefined>
  ): SerializedStyles;
}

declare module '@mui/material/styles' {
  // Palette
  interface Palette {
    accent: SimplePaletteColorOptions;
  }

  interface PaletteOptions {
    accent: SimplePaletteColorOptions;
  }

  // Typography
  interface TypographyVariants {
    teaserPretitle: TypographyStyleOptions;
    teaserTitle: TypographyStyleOptions;
    teaserLead: TypographyStyleOptions;
    teaserMeta: TypographyStyleOptions;

    articleAuthors: TypographyStyleOptions;

    peerInformation: TypographyStyleOptions;

    bannerTitle: TypographyStyleOptions;
    bannerText: TypographyStyleOptions;
    bannerCta: TypographyStyleOptions;

    blockBreakTitle: TypographyStyleOptions;
    blockBreakBody: TypographyStyleOptions;

    blockTitlePreTitle: TypographyStyleOptions;

    blockQuote: TypographyStyleOptions;
  }

  interface TypographyVariantsOptions {
    teaserPretitle?: TypographyStyleOptions;
    teaserTitle?: TypographyStyleOptions;
    teaserLead?: TypographyStyleOptions;
    teaserMeta?: TypographyStyleOptions;

    articleAuthors?: TypographyStyleOptions;

    peerInformation?: TypographyStyleOptions;

    bannerTitle?: TypographyStyleOptions;
    bannerText?: TypographyStyleOptions;
    bannerCta?: TypographyStyleOptions;

    blockBreakTitle?: TypographyStyleOptions;
    blockBreakBody?: TypographyStyleOptions;

    blockTitlePreTitle?: TypographyStyleOptions;

    blockQuote?: TypographyStyleOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    teaserPretitle: true;
    teaserTitle: true;
    teaserLead: true;
    teaserMeta: true;

    articleAuthors: true;

    peerInformation: true;

    bannerTitle: true;
    bannerText: true;
    bannerCta: true;

    blockBreakTitle: true;
    blockBreakBody: true;

    blockTitlePreTitle: true;

    blockQuote: true;
  }
}

export const baseTheme = createTheme();
const {
  palette: { augmentColor },
  breakpoints: originalBreakpoints,
} = baseTheme;

export const minimalTheme = createTheme({
  typography: {
    allVariants: {
      lineHeight: 1.4,
    },
    fontFamily: undefined,
    h1: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h2: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontSize: baseTheme.typography.h3.fontSize,
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h4: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontWeight: 600,
      lineHeight: 1.15,
      fontSize: '1.625rem',
    },
    h5: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h6: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontWeight: 300,
      lineHeight: 1.15,
    },
    body1: {
      fontFamily: undefined,
      lineHeight: undefined,
      letterSpacing: undefined,
      '&.MuiTypography-gutterBottom': {
        marginBottom: baseTheme.spacing(3),
      },
      '&:is(li).MuiTypography-gutterBottom': {
        marginBottom: baseTheme.spacing(1),
      },
    },
    caption: {
      fontFamily: undefined,
      lineHeight: undefined,
      letterSpacing: undefined,
    },
    subtitle1: {
      fontFamily: undefined,
      letterSpacing: undefined,
      fontSize: baseTheme.typography.h6.fontSize,
      fontWeight: 300,
      lineHeight: 1.4,
    },
    // Article
    articleAuthors: {},
    peerInformation: {},
    // Blocks
    blockTitlePreTitle: {},
    blockBreakTitle: {
      fontSize: '40px',
      lineHeight: 1.15,
      fontWeight: 600,
    },
    blockBreakBody: {},
    blockQuote: {
      fontWeight: 600,
      lineHeight: 1.15,
      fontSize: '1.625rem',
    },
    // Teaser
    teaserTitle: {
      fontWeight: 600,
      lineHeight: 1.15,
      fontSize: '1.625rem',
      marginBottom: `0.35em`,
    },
    teaserPretitle: {
      fontSize: '0.875rem',
      fontWeight: 300,
    },
    teaserLead: {
      lineHeight: 1.7,
      marginBottom: baseTheme.spacing(3),
      fontSize: '1rem',
    },
    teaserMeta: {
      fontSize: '0.75rem',
    },
    // Banner
    bannerTitle: {
      fontSize: baseTheme.typography.h5.fontSize,
      lineHeight: 1.15,
    },
    bannerText: {},
    bannerCta: {
      fontSize: baseTheme.typography.h6.fontSize,
      lineHeight: 1.15,
    },
  },
  palette: {
    primary: augmentColor({ color: { main: '#e91e63' } }),
    secondary: augmentColor({ color: { main: '#000' } }),
    accent: augmentColor({ color: { main: '#F5FF64', light: '#A4EFEF' } }),
    grey: {
      800: '#1a1a1a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const baseStyles: CSSObject = {
            borderRadius: '30px',
            textTransform: 'initial',
            boxShadow: 'none',
            ':hover': {
              boxShadow: 'none',
            },
          };

          if (ownerState.color === 'secondary') {
            if (ownerState.variant === 'outlined') {
              return {
                ...baseStyles,
                color: theme.palette.common.white,
                borderColor: 'currentcolor',
                borderWidth: '2px',
                ':hover': {
                  borderWidth: '2px',
                  borderColor: 'currentcolor',
                },
              };
            }

            if (ownerState.variant === 'contained') {
              return {
                ...baseStyles,
                fontWeight: 700,
                backgroundColor: theme.palette.common.white,
                color: theme.palette.common.black,
                ':hover': {
                  backgroundColor: theme.palette.common.white,
                  boxShadow: 'none',
                },
              };
            }
          }

          if (ownerState.variant === 'contained') {
            return {
              ...baseStyles,
              fontWeight: 700,
            };
          }

          return baseStyles;
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        positionStart: {
          flexShrink: 0,
        },
      },
    },
  },
  breakpoints: createBreakpoints({
    values: {
      ...originalBreakpoints.values,
      lg: 1333,
    },
  }),
});

export const theme = createTheme(minimalTheme, {
  typography: {
    blockBreakTitle: {
      textTransform: 'uppercase',
      [baseTheme.breakpoints.up('md')]: {
        fontStyle: 'italic',
        fontSize: '84px',
      },
    },
    teaserTitle: {
      [baseTheme.breakpoints.up('md')]: {
        fontSize: '2rem',
      },
    },
  },
});

export const createWithTheme = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>,
  theme: Theme
) =>
  memo<P>(props => (
    <ThemeProvider theme={theme}>
      <ControlledComponent {...(props as P)} />
    </ThemeProvider>
  ));

export function responsiveProperty({
  cssProperty,
  unit = 'rem',
  breakpoints,
  values,
  transform,
}: {
  cssProperty: keyof TypographyStyleOptions;
  unit: 'rem' | 'em' | 'px';
  breakpoints: { [key in Breakpoint]: number };
  values: { [key in keyof typeof breakpoints]?: number };
  transform?: (number: number) => number;
}) {
  const output: TypographyStyleOptions = {};

  Object.entries(breakpoints).forEach(([key, breakpoint]) => {
    let value = values[key as Breakpoint];

    if (value == null) {
      return;
    }

    if (unit === 'rem') {
      value = value / 16;
    }

    if (transform) {
      value = transform(value);
    }

    if (breakpoint === 0) {
      output[cssProperty] = `${value}${unit}`;
    } else {
      output[`@media (min-width:${breakpoint}px)`] = {
        [cssProperty]: `${value}${unit}`,
      };
    }
  });

  return output;
}
