import styled from '@emotion/styled'
import {Container} from '@mui/material'
import {
  Banner,
  BannerActions,
  BannerCloseButton,
  BannerContent,
  BannerContentWrapper,
  BannerCta,
  BannerCtaText,
  BannerImage,
  BannerText,
  BannerTitle
} from '@wepublish/banner/website'
import {BuilderBannerProps} from '@wepublish/website/builder'
import {useCallback, useEffect, useState} from 'react'

const StyledBanner = styled(Banner)`
  z-index: unset;
  position: unset;
  top: unset;
  background-color: ${({theme}) => theme.palette.primary.main};
  color: ${({theme}) => theme.palette.primary.contrastText};

  [data-role='PRIMARY'] {
    background-color: transparent;
    border: 1px solid ${({theme}) => theme.palette.secondary.main};
    color: ${({theme}) => theme.palette.secondary.main};
  }

  ${BannerContent} {
    ${({theme}) => theme.breakpoints.up('lg')} {
      border-right: 1px solid ${({theme}) => theme.palette.common.white};
      padding-right: ${({theme}) => theme.spacing(6)};
    }
  }

  &[data-collapsed='false'] {
    ${BannerContentWrapper} {
      display: grid;
      row-gap: ${({theme}) => theme.spacing(4)};
      padding: ${({theme}) => theme.spacing(2)};

      ${({theme}) => theme.breakpoints.up('lg')} {
        grid-template-columns: 1fr 1fr;
        align-items: center;
        padding: ${({theme}) => theme.spacing(6)};
        padding-right: ${({theme}) => theme.spacing(12)};
      }
    }

    ${BannerActions} {
      justify-content: unset;
    }

    ${BannerCta} {
      ${({theme}) => theme.breakpoints.up('md')} {
        padding-left: ${({theme}) => theme.spacing(6)};
      }
    }

    ${BannerCtaText} {
      text-align: unset;
    }
  }

  &[data-collapsed='true'] {
    display: block;
    border-radius: 4px;
    grid-template-columns: 1fr;

    ${({theme}) => theme.breakpoints.up('sm')} {
      bottom: ${({theme}) => theme.spacing(1)};
    }

    ${BannerImage}, ${BannerTitle}, ${BannerText}, ${BannerCloseButton}, [data-role='CANCEL'], ${BannerCtaText} {
      display: none;
    }

    ${BannerContentWrapper} {
      padding: ${({theme}) => theme.spacing(2)};
    }
  }
`

const HauptstadtBannerContainer = styled(Container, {
  shouldForwardProp: propName => propName !== 'isScrolled'
})<{isScrolled: boolean}>`
  padding: 0 !important;
  position: fixed;
  top: var(--navbar-height);
  z-index: 1;
  left: 50%;
  transform: translateX(-50%);
  transition: transform 300ms ease-out;

  &:empty {
    display: none;
  }

  ::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 0;
    right: 0;
    transform: translateY(-100%);
    background: ${({theme}) => theme.palette.primary.main};
    height: calc(var(--navbar-height) * 0.66);
  }

  :has([data-collapsed='true']) {
    transform: translateX(-50%) ${({isScrolled}) => isScrolled && `translateY(-35%)`};

    ${({theme}) => theme.breakpoints.up('sm')} {
      transform: translateX(-50%);

      &::before {
        display: none;
      }

      width: 90vw;
      max-width: ${370 / 16}rem;
      top: unset;
      bottom: ${({theme}) => theme.spacing(1)};
    }
  }
`

export const HauptstadtBanner = (props: BuilderBannerProps) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const handleScroll = useCallback(() => setIsScrolled(window.scrollY > 50), [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <HauptstadtBannerContainer maxWidth="lg" isScrolled={isScrolled} data-banner>
      <StyledBanner {...props} />
    </HauptstadtBannerContainer>
  )
}
