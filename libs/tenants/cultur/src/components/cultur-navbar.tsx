import styled from '@emotion/styled';
import { Navbar, NavbarActions } from '@wepublish/navigation/website';

export const CulturNavbar = styled(Navbar)`
  ${({ theme }) => theme.breakpoints.up('sm')} {
    ${NavbarActions} a {
      font-size: calc(${({ theme }) => theme.typography.button.fontSize} * 1.3);
    }
  }
`;
