import styled from '@emotion/styled'
import {
  Footer,
  FooterCategoryLinks,
  FooterIconsWrapper,
  FooterMainLinks,
  FooterName,
  FooterPaperWrapper,
  Navbar,
  NavbarIconButtonWrapper,
  NavbarInnerWrapper,
  NavbarLogoWrapper,
  NavPaperCategoryLinks,
  NavPaperMainLinks,
  NavPaperName
} from '@wepublish/navigation/website'
import {BuilderNavbarProps} from '@wepublish/website/builder'
import {useCallback, useEffect, useState} from 'react'

import {Tiempos} from '../theme'

const ScrollAwareNavbar = (props: BuilderNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const handleScroll = useCallback(() => setIsScrolled(window.scrollY > 50), [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <Navbar {...props} className={`${props.className || ''} ${isScrolled ? 'scrolled' : ''}`} />
  )
}

export const HauptstadtNavbar = styled(ScrollAwareNavbar)`
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  transition: clip-path 500ms ease-out;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({theme}) => theme.palette.primary.main};
    transition: clip-path 500ms ease-out;
    clip-path: polygon(0 99%, 100% 99%, 100% 100%, 0 100%);
  }

  &.scrolled {
    clip-path: polygon(0 0, 100% 0, 100% 50%, 0 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &::after {
      clip-path: polygon(0 99%, 100% 49%, 100% 50%, 0 100%);
    }

    ${NavbarLogoWrapper} {
      transform: scale(0.8);
    }
  }

  ${NavbarLogoWrapper} {
    transition: transform 400ms ease-out;
    transform: scale(1);
    transform-origin: top center;
  }

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
    font-weight: 400;
  }

  ${NavPaperMainLinks} span {
    font-family: ${Tiempos.style.fontFamily};
  }
`

export const HauptstadtFooter = styled(Footer)`
  display: grid;
  justify-content: center;
  grid-template-columns: minmax(0, 492px);
  gap: ${({theme}) => theme.spacing(2)};
  padding-top: ${({theme}) => theme.spacing(6)};
  padding-bottom: ${({theme}) => theme.spacing(6)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: minmax(0, 760px);
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: minmax(0, 868px);
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-template-columns: minmax(0, 1080px);
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    grid-template-columns: minmax(0, 1425px);
  }

  ${({theme}) => theme.breakpoints.up('xxl')} {
    grid-template-columns: minmax(0, 2100px);
    padding-top: ${({theme}) => theme.spacing(8)};
    padding-bottom: ${({theme}) => theme.spacing(8)};
  }

  &,
  ${FooterPaperWrapper}, ${FooterIconsWrapper} {
    background-color: ${({theme}) => theme.palette.secondary.main};
    color: ${({theme}) => theme.palette.secondary.contrastText};
  }

  ${FooterName} {
    display: none;
  }

  ${FooterCategoryLinks} span {
    font-weight: 400;
  }

  ${FooterMainLinks} span {
    font-family: ${Tiempos.style.fontFamily};
  }

  ${FooterIconsWrapper} {
    padding-top: ${({theme}) => theme.spacing(2)};
    padding-bottom: ${({theme}) => theme.spacing(2)};
  }

  ${FooterIconsWrapper},
  ${FooterPaperWrapper} {
    padding: 0;
    padding-left: ${({theme}) => theme.spacing(2)};
    padding-right: ${({theme}) => theme.spacing(2)};

    ${({theme}) => theme.breakpoints.up('sm')} {
      padding-left: ${({theme}) => theme.spacing(3)};
      padding-right: ${({theme}) => theme.spacing(3)};
    }
  }
`
