import {
  createTheme,
  css,
  GlobalStyles,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

import faroWebDisplayLucky from './fonts/FaroWeb-DisplayLucky.woff2';
import faroWebSemiBoldLucky from './fonts/FaroWeb-SemiBoldLucky.woff2';
import signifierMediumItalic from './fonts/SignifierMedium-Italic.woff2';

export const Faro = { family: 'Faro' };
export const Signifier = { family: 'Signifier' };

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({
      color: { main: '#232524', light: '#F2BDB8', contrastText: '#FFF' },
    }),
    secondary: augmentColor({
      color: { main: '#FFEDEB', contrastText: '#000' },
    }),
    accent: augmentColor({ color: { main: '#FFEDEB', contrastText: '#000' } }),
  },
  typography: {
    h1: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '800',
    },
    h2: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '800',
    },
    h3: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '800',
    },
    h4: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '800',
    },
    h5: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '600',
    },
    body2: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
      fontWeight: '600',
    },
    button: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [Faro.family, 'sans-serif'].join(','),
    },
    teaserTitle: {
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedSizeLarge: {
          padding: `${WePTheme.spacing(1.5)} ${WePTheme.spacing(3)}`,
          fontSize: '1.1em',
          color: '#000',
          backgroundColor: '#F2BDB8',
        },
        contained: {
          color: '#000',
          backgroundColor: '#F2BDB8 !important',
        },
        outlined: {
          color: '#F2BDB8',
          borderColor: '#F2BDB8',
        },
        textSecondary: {
          color: '#F2BDB8',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        'em, i': {
          fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
          fontWeight: '400',
          fontStyle: 'italic',
        },
        'em[style*="font-style: normal"]': {
          fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
          fontWeight: '400',
          fontStyle: 'italic !important',
        },
        blockquote: {
          fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
          fontWeight: '400',
          fontStyle: 'italic',
        },
        li: {
          fontSize: '1.25rem',
        },
      },
    },
    MuiQuoteBlock: {
      styleOverrides: {
        root: {
          '& p': {
            fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
            fontWeight: '400',
            fontStyle: 'italic',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-root': {
            '&:is(blockquote, blockquote *)': {
              fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
              fontWeight: '400',
              fontStyle: 'italic',
            },
          },
        },
        h4: {
          '&:is(blockquote, blockquote *)': {
            fontFamily: [Signifier.family, 'serif'].join(',') + ' !important',
            fontWeight: '400',
            fontStyle: 'italic',
          },
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };

export const WntiGlobalStyles = () => (
  <GlobalStyles
    styles={css`
      @font-face {
        font-family: ${Faro.family};
        src: url('${faroWebDisplayLucky}') format('woff2');
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${Faro.family};
        src: url('${faroWebSemiBoldLucky}') format('woff2');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${Signifier.family};
        src: url('${signifierMediumItalic}') format('woff2');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }
    `}
  />
);
