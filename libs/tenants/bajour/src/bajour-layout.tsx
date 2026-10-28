import styled from '@emotion/styled';
import { ThemeProvider } from '@mui/material';
import {
  FooterContainer,
  FooterPaperWrapper,
  NavbarContainer,
  NavbarContainerProps,
} from '@wepublish/navigation/website';

import { navbarTheme } from './styles/theme';

const StyledNavbar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 12;
`;

export const BajourNavbar = (props: NavbarContainerProps) => (
  <ThemeProvider theme={navbarTheme}>
    <StyledNavbar {...props} />
  </ThemeProvider>
);

export const BajourFooter = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;
