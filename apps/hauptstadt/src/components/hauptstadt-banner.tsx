import styled from '@emotion/styled'
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

export const HauptstadtBanner = styled(Banner)`
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

  &[data-collapsed='false'] ${BannerCta} {
    ${({theme}) => theme.breakpoints.up('md')} {
      padding-left: ${({theme}) => theme.spacing(6)};
    }
  }

  ${BannerCtaText} {
    text-align: unset;
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
  }

  &[data-collapsed='true'] {
    top: unset;
    display: block;
    border-radius: 4px;
    grid-template-columns: 1fr;
    position: fixed;
    bottom: ${({theme}) => theme.spacing(2)};
    left: 50%;
    transform: translateX(-50%);
    width: 90vw;
    max-width: ${370 / 16}rem;

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
