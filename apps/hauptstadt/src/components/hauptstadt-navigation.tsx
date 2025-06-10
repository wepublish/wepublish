import styled from '@emotion/styled'
import {
  Footer,
  FooterName,
  FooterPaperCategoryLinks,
  FooterPaperMainLinks,
  FooterPaperWrapper,
  Navbar,
  NavbarIconButtonWrapper,
  NavbarInnerWrapper,
  NavPaperCategoryLinks,
  NavPaperMainLinks,
  NavPaperName
} from '@wepublish/navigation/website'

import {Tiempos} from '../theme'

export const HauptstadtNavbar = styled(Navbar)`
  ${NavbarInnerWrapper} {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: ${({theme}) => theme.breakpoints.values.lg}px;
    border-bottom: 1px solid ${({theme}) => theme.palette.primary.main};

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

  ${NavPaperName} {
    display: none;
  }

  ${NavPaperCategoryLinks} span {
    font-weight: 400;
  }

  ${NavPaperMainLinks} span {
    font-family: ${Tiempos.style.fontFamily};
  }
`

export const HauptstadtFooter = styled(Footer)`
  ${FooterPaperWrapper} {
    background-color: ${({theme}) => theme.palette.secondary.main};
    color: ${({theme}) => theme.palette.secondary.contrastText};
  }

  ${FooterName} {
    display: none;
  }

  ${FooterPaperCategoryLinks} span {
    font-weight: 400;
  }

  ${FooterPaperMainLinks} span {
    font-family: ${Tiempos.style.fontFamily};
  }
`
