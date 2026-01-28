import { css, GlobalStyles } from '@mui/material';

const globalCSS = css`
  html {
    hyphenate-limit-chars: auto 8 8;
    -webkit-hyphenate-limit-before: 8;
    -webkit-hyphenate-limit-after: 8;
  }
`;

export const OnlineReportsGlobalStyles = () => (
  <GlobalStyles styles={globalCSS} />
);
