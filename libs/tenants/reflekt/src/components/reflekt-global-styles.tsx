import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme) => css`
  :root {
    --navbar-bg-color-hero-off-screen: transparent;
    --breakpoint-width: min(${theme.breakpoints.values.lg}px, 100vw);

    ${theme.breakpoints.up('md')} {
      --navbar-bg-color-hero-off-screen: ${theme.palette.common.white};
    }
  }

  .MuiTypography-root:has(
    .MuiTypography-buttonLinkSecondary,
    .MuiTypography-buttonLinkMain
  ) {
    text-align: center;
  }
`;

export const ReflektGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
