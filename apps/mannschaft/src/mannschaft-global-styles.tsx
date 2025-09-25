import { css, GlobalStyles } from '@mui/material';
import { memo } from 'react';

const globalCSS = css`
  html {
    hyphenate-limit-chars: auto 10 10;
    -webkit-hyphenate-limit-before: 10;
    -webkit-hyphenate-limit-after: 10;
  }
`;

export const MannschaftGlobalStyles = memo(function MannschaftGlobalStyles() {
  return <GlobalStyles styles={globalCSS} />;
});
