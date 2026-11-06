import { CSSObject } from '@emotion/react';
import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { css, GlobalStyles } from '@mui/material';
import { responsiveProperty, theme as WePTheme } from '@wepublish/ui';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

import fFFAcidGroteskRegular from './fonts/fff-acid-grotesk/FFF-AcidGrotesk-Regular.woff2';
import gTSuperTextBold from './fonts/gt-super-text/GT-Super-Text-Bold.woff2';
import gTSuperTextBookItalic from './fonts/gt-super-text/GT-Super-Text-Book-Italic.woff2';
import gTSuperTextBook from './fonts/gt-super-text/GT-Super-Text-Book.woff2';

export const gtSuperText = { family: 'GT Super Text' };
export const fffAcidGrotesk = { family: 'FFF Acid Grotesk' };

const {
  palette: { augmentColor },
} = WePTheme;

const mergeDeepAll = reduce(mergeDeepRight, {});

const fontSmall = mergeDeepAll([
  responsiveProperty({
    cssProperty: 'fontSize',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 12,
      md: 16,
    },
  }),
  responsiveProperty({
    cssProperty: 'lineHeight',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 16,
      md: 22,
    },
  }),
  responsiveProperty({
    cssProperty: 'letterSpacing',
    unit: 'rem',
    breakpoints: WePTheme.breakpoints.values,
    values: {
      xs: 0.5,
      md: 0.8,
    },
  }),
]);

const titleBlock = {
  fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
  fontWeight: 400,
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 32,
        md: 60,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 36,
        md: 68,
      },
    }),
    responsiveProperty({
      cssProperty: 'letterSpacing',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 1,
        md: 0.6,
      },
    }),
  ]),
};

const lead = {
  fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 19,
        md: 25,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 24,
        md: 30,
      },
    }),
  ]),
};

const paragraph = {
  fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
  letterSpacing: 0.1,
  ...mergeDeepAll([
    responsiveProperty({
      cssProperty: 'fontSize',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 17,
        md: 20,
      },
    }),
    responsiveProperty({
      cssProperty: 'lineHeight',
      unit: 'rem',
      breakpoints: WePTheme.breakpoints.values,
      values: {
        xs: 24,
        md: 28,
      },
    }),
  ]),
};

const theme = createTheme(WePTheme, {
  typography: {
    h1: titleBlock,
    h2: titleBlock,
    h3: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    h5: {
      ...paragraph,
      fontWeight: 600,
    },
    h6: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    body1: paragraph,
    body2: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    button: {
      ...fontSmall,
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      fontWeight: 400,
      letterSpacing: 0.8,
    },
    caption: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 16,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 22,
          },
        }),
      ]),
    },
    overline: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    subtitle1: lead,
    subtitle2: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    articleAuthors: {
      ...fontSmall,
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
    },
    blockTitlePreTitle: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 16,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 22,
          },
        }),
      ]),
    },
    teaserPretitle: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 16,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 22,
          },
        }),
      ]),
    },
    teaserTitle: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 32,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 36,
          },
        }),
      ]),
    },
    teaserLead: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 19,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 24,
          },
        }),
      ]),
    },
    teaserMeta: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 12,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 16,
          },
        }),
      ]),
    },
    allVariants: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
    },
  },
  palette: {
    primary: augmentColor({
      color: { light: '#64DDB0', main: '#21CE8E', dark: '#179063' },
    }),
    secondary: augmentColor({
      color: { light: '#FE97B6', main: '#FD6A96', dark: '#B14A69' },
    }),
    accent: augmentColor({
      color: { light: '#F3FF97', main: '#EEFF6A', dark: '#E0F159' },
    }),
    error: augmentColor({
      color: { light: '#F06D4B', main: '#EC491E', dark: '#BD3A18' },
    }),
    warning: augmentColor({
      color: { light: '#A54DD8', main: '#8E21CE', dark: '#631790' },
    }),
    info: augmentColor({
      color: { light: '#92D2F1', main: '#63BEEB', dark: '#4F98BC' },
    }),
    success: augmentColor({
      color: { light: '#64DDB0', main: '#21CE8E', dark: '#179063' },
    }),
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center',
        },
        message: {
          fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
          ...mergeDeepAll([
            responsiveProperty({
              cssProperty: 'fontSize',
              unit: 'rem',
              breakpoints: WePTheme.breakpoints.values,
              values: {
                xs: 12,
              },
            }),
            responsiveProperty({
              cssProperty: 'lineHeight',
              unit: 'rem',
              breakpoints: WePTheme.breakpoints.values,
              values: {
                xs: 16,
              },
            }),
          ]),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const baseStyles: CSSObject = {
            ...((WePTheme.components?.MuiButton?.styleOverrides?.root as any)?.(
              {
                ownerState,
                theme,
              }
            ) ?? {}),
            fontWeight: undefined,
          };

          if (ownerState.color === 'secondary') {
            if (ownerState.variant === 'outlined') {
              return {
                ...baseStyles,
                color: theme.palette.common.black,
              };
            }
          }

          return baseStyles;
        },
      },
    },
  } as ThemeOptions['components'],
} as PartialDeep<Theme> | ThemeOptions);

export const ContentTheme = createTheme(theme, {
  typography: {
    body: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [gtSuperText.family, 'sans-serif'].join(','),
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const AlternatingTeaserTheme = createTheme(theme, {
  typography: {
    teaserTitle: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 48,
          },
        }),
        responsiveProperty({
          cssProperty: 'lineHeight',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 54,
          },
        }),
      ]),
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const TeaserSlotsTheme = createTheme(theme, {
  typography: {
    teaserSlotsTitle: {
      fontFamily: [fffAcidGrotesk.family, 'sans-serif'].join(','),
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: WePTheme.breakpoints.values,
          values: {
            xs: 32,
            md: 60,
          },
        }),
      ]),
      fontWeight: 500,
      color: theme.palette.common.black,
      paddingBottom: theme.spacing(1),
      lineHeight: 1.2,
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          teaserSlotsTitle: 'h2',
        },
      },
      styleOverrides: {
        root: {
          '&:empty': {
            display: 'none',
          },
        },
      },
    },
  } as ThemeOptions['components'],
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };

export const FazettenGlobalStyles = () => (
  <GlobalStyles
    styles={theme => css`
      @font-face {
        font-family: ${gtSuperText.family};
        src: url(${gTSuperTextBook}) format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${gtSuperText.family};
        src: url(${gTSuperTextBookItalic}) format('woff2');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${gtSuperText.family};
        src: url(${gTSuperTextBold}) format('woff2');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${fffAcidGrotesk.family};
        src: url(${fFFAcidGroteskRegular}) format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        text-wrap: pretty;
      }
    `}
  />
);
