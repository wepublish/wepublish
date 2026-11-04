import {
  createTheme,
  css,
  CSSObject,
  GlobalStyles,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

const fontUrl = (file: string) =>
  new URL(`./fonts/${file}`, import.meta.url).href;

export const plainFont = { family: 'Plain' };

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({ color: { main: '#000', contrastText: '#FFFFFF' } }),
    secondary: augmentColor({ color: { main: '#E94090' } }),
    accent: augmentColor({ color: { main: '#00AEC2', light: '#FFEE00' } }),
    error: augmentColor({ color: { main: '#e4002c' } }),
    warning: augmentColor({ color: { main: '#f07d24' } }),
    info: augmentColor({ color: { main: '#1e398f' } }),
    success: augmentColor({ color: { main: '#0aa537' } }),
  },
  typography: {
    h1: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    // Article
    articleAuthors: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    // Blocks
    blockBreakTitle: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    blockBreakBody: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    blockQuote: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    blockTitlePreTitle: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    teaserTitle: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    teaserLead: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    teaserMeta: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    teaserPretitle: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    // Banner
    bannerCta: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    bannerText: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
    bannerTitle: {
      fontFamily: [plainFont.family, 'sans-serif'].join(','),
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => {
          const baseStyles: CSSObject = {
            color: theme.palette.secondary.main,
            textDecoration: 'none',
          };
          return baseStyles;
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };

export const MannschaftFontFaces = () => (
  <GlobalStyles
    styles={css`
      @font-face {
        font-family: ${plainFont.family};
        src: url('${fontUrl('Plain-Light.otf')}') format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${plainFont.family};
        src: url('${fontUrl('Plain-Light-Italic.otf')}') format('opentype');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${plainFont.family};
        src: url('${fontUrl('Plain-Medium.otf')}') format('opentype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }
    `}
  />
);
