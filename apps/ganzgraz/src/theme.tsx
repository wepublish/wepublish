import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { minimalTheme, responsiveProperty } from '@wepublish/ui';
import { League_Spartan } from 'next/font/google';
import { Montserrat } from 'next/font/google';
import { mergeDeepRight, reduce } from 'ramda';
import { PartialDeep } from 'type-fest';

const mergeDeepAll = reduce(mergeDeepRight, {});

const leagueSpartan = League_Spartan({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const montserrat = Montserrat({
  weight: ['100', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const {
  palette: { augmentColor },
} = minimalTheme;

const theme = createTheme(minimalTheme, {
  palette: {
    primary: augmentColor({
      color: {
        main: '#4E2996',
      },
    }),
    secondary: augmentColor({
      color: {
        main: '#CDB9EE',
      },
    }),
    accent: augmentColor({
      color: {
        main: '#FF8900',
      },
    }),
  },
  typography: {
    h1: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
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
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
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
    h3: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
    },
    blockQuote: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
      fontStyle: 'italic',
      ...mergeDeepAll([
        responsiveProperty({
          cssProperty: 'fontSize',
          breakpoints: minimalTheme.breakpoints.values,
          unit: 'rem',
          values: {},
        }),
      ]),
    },
    allVariants: {
      fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export const TeaserSlotsTheme = {
  typography: {
    teaserSlotsTitle: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
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
} as PartialDeep<Theme> | ThemeOptions;

export { theme as default };
