import { Theme, ThemeOptions } from '@mui/material';
import { minimalTheme, responsiveProperty } from '@wepublish/ui';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

const mergeDeepAll = reduce(mergeDeepRight, {});

const theme = {
  typography: {
    h1: {
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: minimalTheme.breakpoints.values,
          values: {
            xs: 24,
            md: 36,
          },
        }),
      ]),
    },
    h2: {
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: minimalTheme.breakpoints.values,
          values: {
            xs: 24,
            md: 36,
          },
        }),
      ]),
    },
  },
} as PartialDeep<Theme> | ThemeOptions;

export const TeaserSlotsTheme = {
  typography: {
    teaserSlotsTitle: {
      fontFamily: `"League Spartan", Helvetica, Arial, sans-serif`,
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          unit: 'rem',
          breakpoints: minimalTheme.breakpoints.values,
          values: {
            xs: 32,
            md: 60,
          },
        }),
      ]),
      fontWeight: 500,
      color: minimalTheme.palette.common.black,
      paddingBottom: minimalTheme.spacing(1),
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
} as PartialDeep<Theme> | ThemeOptions;

export { theme as default };
