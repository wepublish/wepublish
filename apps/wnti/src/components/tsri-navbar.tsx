import styled from '@emotion/styled';
import {
  Navbar,
  NavbarActions,
  NavbarInnerWrapper,
} from '@wepublish/navigation/website';

export const TsriNavbar = styled(Navbar)`
  ${NavbarInnerWrapper} {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: ${({ theme }) => theme.breakpoints.values.lg}px;

    ${({ theme }) => theme.breakpoints.up('lg')} {
      padding-left: ${({ theme }) => theme.spacing(3)};
      padding-right: ${({ theme }) => theme.spacing(3)};
    }
  }

  ${NavbarActions} {
    .MuiIconButton-root {
      display: none;
    }
  }
`;
