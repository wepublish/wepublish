import { GlobalStyles } from '@mui/material';

import { courantTokens } from '../brand-tokens';
import {
  bodySans,
  bodySansCaptions,
  bodySansKicker,
  displaySerif,
  editorialSerif,
} from '../font-faces';

const typographyVariables = Object.fromEntries(
  Object.entries(courantTokens.typography.roles).flatMap(([name, role]) => [
    [`--courant-${name}-lh`, role.lineHeight],
    [`--courant-${name}-tracking`, role.letterSpacing],
    [`--courant-${name}-weight`, role.fontWeight],
  ])
);

export const CourantGlobalStyles = () => (
  <GlobalStyles
    styles={theme => ({
      ':root': {
        '--courant-display': `${displaySerif.style.fontFamily}, serif`,
        '--courant-editorial': `${editorialSerif.style.fontFamily}, serif`,
        '--courant-sans': `${bodySans.style.fontFamily}, sans-serif`,
        '--courant-captions': `${bodySansCaptions.style.fontFamily}, sans-serif`,
        '--courant-kicker': `${bodySansKicker.style.fontFamily}, sans-serif`,
        ...typographyVariables,
        '--courant-heading-color':
          theme.typography.h1.color ?? theme.palette.text.primary,
      },
    })}
  />
);
