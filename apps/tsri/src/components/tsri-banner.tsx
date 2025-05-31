import styled from '@emotion/styled'
import {Banner, BannerCloseButton, BannerContentWrapper} from '@wepublish/banner/website'

const TsriBanner = styled(Banner)(
  ({theme}) => `

  ${BannerContentWrapper} {
    background-color: ${theme.palette.primary.main};
    padding: ${theme.spacing(2)};

    ${theme.breakpoints.up('md')} {
      padding: ${theme.spacing(6)} ${theme.spacing(12)};
    }
  }

  ${BannerCloseButton} {
    top: ${theme.spacing(2)};
    right: ${theme.spacing(2)};

    ${theme.breakpoints.up('md')} {
      top: ${theme.spacing(6)};
      right: ${theme.spacing(6)};
    }
  }

  [data-role='PRIMARY'] button {
    background-color: ${theme.palette.primary.contrastText};
    color: ${theme.palette.secondary.main};
    border: 2px solid ${theme.palette.primary.contrastText};
  }

  [data-role='OTHER'] button {
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    border: 2px solid ${theme.palette.primary.contrastText};
  }
`
)

export {TsriBanner}
