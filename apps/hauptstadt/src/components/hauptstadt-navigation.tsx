import styled from '@emotion/styled'
import {
  Footer,
  FooterName,
  FooterPaperCategoryLinks,
  FooterPaperWrapper,
  Navbar,
  NavbarIconButtonWrapper,
  NavbarInnerWrapper,
  NavPaperCategoryLinks,
  NavPaperName
} from '@wepublish/navigation/website'

import {ABCWhyte} from '../theme'

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

  ${NavPaperName} {
    display: none;
  }

  ${NavPaperCategoryLinks} span {
    font-family: ${ABCWhyte.style.fontFamily};
    font-weight: 400;
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
    font-family: ${ABCWhyte.style.fontFamily};
    font-weight: 400;
  }
`
