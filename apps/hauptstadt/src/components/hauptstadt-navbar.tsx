import styled from '@emotion/styled'
import {Navbar, NavbarIconButtonWrapper, NavbarInnerWrapper} from '@wepublish/navigation/website'

export const HauptstadtNavbar = styled(Navbar)`
  ${NavbarInnerWrapper} {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: ${({theme}) => theme.breakpoints.values.lg}px;

    ${({theme}) => theme.breakpoints.up('lg')} {
      padding-left: ${({theme}) => theme.spacing(3)};
      padding-right: ${({theme}) => theme.spacing(3)};
    }
  }

  ${NavbarIconButtonWrapper} {
    background-color: transparent;
    color: ${({theme}) => theme.palette.primary.contrastText};

    ${({theme}) => theme.breakpoints.up('md')} {
      svg {
        font-size: ${({theme}) => theme.spacing(4.5)};
      }
    }
  }
`
