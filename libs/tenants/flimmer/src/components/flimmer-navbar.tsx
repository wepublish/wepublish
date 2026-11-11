import styled from '@emotion/styled';
import { Navbar, NavbarInnerWrapper } from '@wepublish/navigation/website';

export const FlimmerNavbar = styled(Navbar)`
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
`;
