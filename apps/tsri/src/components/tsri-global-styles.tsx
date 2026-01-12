import { css, GlobalStyles } from '@mui/material';

const globalCSS = css`
  :root {
    --two-column-grid: calc(100% - 2.2cqw - 32.6%) 32.6%;
    --two-column-grid-no-gap: calc(100% - 32.6%) 32.6%;
  }
`;

export const TsriGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
