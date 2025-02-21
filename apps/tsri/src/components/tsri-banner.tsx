import {styled} from '@mui/material'
import {PageBanner} from '@wepublish/website'

const TsriBanner = styled(PageBanner.Banner)(
  ({theme}) => `

  ${PageBanner.BannerContent} {
    background-color: ${theme.palette.primary.main};
    padding: ${theme.spacing(2)};

    ${theme.breakpoints.up('md')} {
      padding: ${theme.spacing(6)} ${theme.spacing(12)};
    }
  }

  ${PageBanner.BannerTitle} {
    font-size: ${theme.typography.h3.fontSize};
  }

  ${PageBanner.BannerCloseButton} {
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
