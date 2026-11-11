import { css, GlobalStyles, Theme, ThemeOptions } from '@mui/material';
import { PartialDeep } from 'type-fest';

import linotypeSabonNextLTProBold from './fonts/sabon/Linotype - SabonNextLTPro-Bold.otf';
import linotypeSabonNextLTProBoldItalic from './fonts/sabon/Linotype - SabonNextLTPro-BoldItalic.otf';
import linotypeSabonNextLTProItalic from './fonts/sabon/Linotype - SabonNextLTPro-Italic.otf';
import linotypeSabonNextLTProRegular from './fonts/sabon/Linotype - SabonNextLTPro-Regular.otf';
import typeTypeTTNormsBoldItalic from './fonts/tt-norms/TypeType - TT Norms Bold Italic.otf';
import typeTypeTTNormsBold from './fonts/tt-norms/TypeType - TT Norms Bold.otf';
import typeTypeTTNormsItalic from './fonts/tt-norms/TypeType - TT Norms Italic.otf';
import typeTypeTTNormsMediumItalic from './fonts/tt-norms/TypeType - TT Norms Medium Italic.otf';
import typeTypeTTNormsMedium from './fonts/tt-norms/TypeType - TT Norms Medium.otf';
import typeTypeTTNormsRegular from './fonts/tt-norms/TypeType - TT Norms Regular.otf';

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
        src: url('${linotypeSabonNextLTProRegular}') format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${linotypeSabonNextLTProItalic}') format('opentype');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${linotypeSabonNextLTProBold}') format('opentype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${sabon.family};
        src: url('${linotypeSabonNextLTProBoldItalic}') format('opentype');
        font-weight: 600;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsRegular}') format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsItalic}') format('opentype');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsMedium}') format('opentype');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsMediumItalic}') format('opentype');
        font-weight: 500;
        font-style: italic;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsBold}') format('opentype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: ${ttNorms.family};
        src: url('${typeTypeTTNormsBoldItalic}') format('opentype');
        font-weight: 600;
        font-style: italic;
        font-display: swap;
      }
    `}
  />
);
