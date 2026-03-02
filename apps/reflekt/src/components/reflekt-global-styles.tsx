import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme) => css`
  :root {
    --navbar-bg-color-hero-off-screen: white;
  }
`;

export const ReflektGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
