import { css, GlobalStyles, Theme, ThemeOptions } from '@mui/material';
import { PartialDeep } from 'type-fest';

const fontUrl = (file: string) =>
  new URL(`./fonts/${file}`, import.meta.url).href;

export const sabon = { family: 'Sabon Next LT Pro' };
export const ttNorms = { family: 'TT Norms' };

const theme = {
  typography: {
    h1: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    // Article
    articleAuthors: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    peerInformation: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    // Blocks
    blockTitlePreTitle: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    blockBreakTitle: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    blockBreakBody: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    blockQuote: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    // Teaser
    teaserTitle: {
      fontFamily: [sabon.family, 'sans-serif'].join(','),
    },
    teaserPretitle: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    teaserLead: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    teaserMeta: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    // Banner
    bannerTitle: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    bannerText: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    bannerCta: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [ttNorms.family, 'sans-serif'].join(','),
    },
  },
} as PartialDeep<Theme> | ThemeOptions;

export { theme as default };

export const MunotgloeggliGlobalStyles = () => (
  <GlobalStyles
    styles={css`
      @font-face {
        font-family: ${sabon.family};
        src: url('${fontUrl('sabon/Linotype - SabonNextLTPro-Regular.otf')}')
          format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${fontUrl('sabon/Linotype - SabonNextLTPro-Italic.otf')}')
          format('opentype');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${fontUrl('sabon/Linotype - SabonNextLTPro-Bold.otf')}')
          format('opentype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${fontUrl('sabon/Linotype - SabonNextLTPro-BoldItalic.otf')}')
          format('opentype');
        font-weight: 600;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Regular.otf')}')
          format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Italic.otf')}')
          format('opentype');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Medium.otf')}')
          format('opentype');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Medium Italic.otf')}')
          format('opentype');
        font-weight: 500;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Bold.otf')}')
          format('opentype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${fontUrl('tt-norms/TypeType - TT Norms Bold Italic.otf')}')
          format('opentype');
        font-weight: 600;
        font-style: italic;
        font-display: swap;
      }
    `}
  />
);
