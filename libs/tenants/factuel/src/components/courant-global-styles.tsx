import { css, GlobalStyles } from '@mui/material';

import { courantTokens } from '../brand-tokens';
import {
  bodySans,
  bodySansCaptions,
  bodySansKicker,
  courantFonts,
  displaySerif,
  editorialSerif,
} from '../font-faces';

const fontFaceCss = courantFonts
  .flatMap(font =>
    font.faces.map(
      face => css`
        @font-face {
          font-family: '${font.family}';
          src: url('${face.src}') format('woff2');
          font-weight: ${face.weight};
          font-style: ${face.style};
          font-display: swap;
        }
      `
    )
  )
  .reduce(
    (acc, rule) => css`
      ${acc}${rule}
    `
  );

const typographyVariables = Object.fromEntries(
  Object.entries(courantTokens.typography.roles).flatMap(([name, role]) => [
    [`--courant-${name}-lh`, role.lineHeight],
    [`--courant-${name}-tracking`, role.letterSpacing],
    [`--courant-${name}-weight`, role.fontWeight],
  ])
);

export const CourantGlobalStyles = () => (
  <>
    <GlobalStyles styles={fontFaceCss} />
    <GlobalStyles
      styles={theme => ({
        ':root': {
          '--courant-display': `${displaySerif.family}, serif`,
          '--courant-editorial': `${editorialSerif.family}, serif`,
          '--courant-sans': `${bodySans.family}, sans-serif`,
          '--courant-captions': `${bodySansCaptions.family}, sans-serif`,
          '--courant-kicker': `${bodySansKicker.family}, sans-serif`,
          ...typographyVariables,
          '--courant-heading-color':
            theme.typography.h1.color ?? theme.palette.text.primary,
        },
      })}
    />
  </>
);
