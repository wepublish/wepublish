import { css, GlobalStyles, Theme } from '@mui/material';

const globalCSS = (theme: Theme, isHomePage: boolean) => css`
  ${isHomePage &&
  css`
    body {
      background: linear-gradient(
        to bottom,
        ${theme.palette.primary.main} 30vh,
        ${theme.palette.common.white} 55vh
      );

      ${theme.breakpoints.up('md')} {
        background: linear-gradient(
          to bottom,
          ${theme.palette.primary.main} 30vh,
          ${theme.palette.common.white} 110vh
        );
      }
    }
  `}
  :root {
    --navbar-bg-color-hero-off-screen: transparent;
    --breakpoint-width: 100%;

    ${theme.breakpoints.up('md')} {
      --breakpoint-width: ${theme.breakpoints.values.md}px;
      --navbar-bg-color-hero-off-screen: transparent;
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

export const WepGlobalStyles = ({
  isHomePage = false,
}: {
  isHomePage?: boolean;
}) => <GlobalStyles styles={theme => globalCSS(theme, isHomePage)} />;
