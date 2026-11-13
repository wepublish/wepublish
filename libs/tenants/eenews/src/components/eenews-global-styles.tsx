import { css, GlobalStyles, Theme } from '@mui/material';

import { EenewsFontFaces } from '../theme';

const globalCSS = (theme: Theme) => css`
  :root {
    --max-width: 1150px;
    --navbar-height: 0px;
    --skycraper-width: 160px;

    ${theme.breakpoints.up('md')} {
      --max-width: 1150px;
    }
  }

  html {
    overflow-anchor: none;
  }

  html,
  body {
    @media (min-width: 1200px) {
      scroll-padding-top: ${theme.spacing(12.5)};
    }
  }
`;

export const EenewsGlobalStyles = () => (
  <>
    <EenewsFontFaces />
    <GlobalStyles styles={globalCSS} />
  </>
);
