import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme) => css`
  :root {
    --sizing-factor: 1;
    --two-column-grid: unset;
    --two-column-grid-no-gap: unset;

    ${theme.breakpoints.up('md')} {
      --two-column-grid: calc(100% - 2.2cqw - 32.6%) 32.6%;
      --two-column-grid-no-gap: calc(100% - 32.6%) 32.6%;
    }
  }
`;

export const TsriGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
