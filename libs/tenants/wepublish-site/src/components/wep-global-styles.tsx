import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme) => css`
  :root {
    --breakpoint-width: 100%;

    ${theme.breakpoints.up('md')} {
      --breakpoint-width: ${theme.breakpoints.values.md}px;
      --container-max-width: ${theme.breakpoints.values.md}px;
    }
    ${theme.breakpoints.up('lg')} {
      --breakpoint-width: ${theme.breakpoints.values.lg}px;
      --container-max-width: ${theme.breakpoints.values.lg}px;
    }
    ${theme.breakpoints.up('xl')} {
      --breakpoint-width: ${theme.breakpoints.values.xl}px;
      --container-max-width: ${theme.breakpoints.values.xl}px;
    }
  }
`;

export const WepGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
