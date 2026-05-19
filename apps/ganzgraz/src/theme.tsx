import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { responsiveProperty, theme as WePTheme } from '@wepublish/ui';
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

const colors = {
  primary: {
    main: '#4E2996', // Dunkellila
  },
  secondary: {
    main: '#CDB9EE', // Flieder
  },
  accent: {
    main: '#FF8900', // Orange
  },
  common: {
    black: '#000000',
    white: '#ffffff',
  },
};

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    common: {
      black: colors.common.black,
      white: colors.common.white,
    },
    primary: augmentColor({
      color: {
        main: colors.primary.main,
      },
    }),
    secondary: augmentColor({
      color: {
        main: colors.secondary.main,
      },
    }),
    accent: augmentColor({
      color: {
        main: colors.accent.main,
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
          breakpoints: WePTheme.breakpoints.values,
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
          breakpoints: WePTheme.breakpoints.values,
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
          breakpoints: WePTheme.breakpoints.values,
          unit: 'rem',
          values: {},
        }),
      ]),
    },
    fontFamily: [montserrat.style.fontFamily, 'sans-serif'].join(','),
  },
} as PartialDeep<Theme> | ThemeOptions);

export const TeaserSlotsTheme = createTheme(theme, {
  typography: {
    teaserSlotsTitle: {
      fontFamily: [leagueSpartan.style.fontFamily, 'sans-serif'].join(','),
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
