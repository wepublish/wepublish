import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme) => css`
  :root {
    --navbar-bg-color-hero-off-screen: ${theme.palette.common.white};
    --breakpoint-width: 100%;

  ${theme.breakpoints.up('md')} {
    --breakpoint-width: ${theme.breakpoints.values.md}px;
  }
  ${theme.breakpoints.up('lg')} {
    --breakpoint-width: ${theme.breakpoints.values.lg}px;
  }
  ${theme.breakpoints.up('xl')} {
    --breakpoint-width: ${theme.breakpoints.values.xl}px;
  }
`;

export const ReflektGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
