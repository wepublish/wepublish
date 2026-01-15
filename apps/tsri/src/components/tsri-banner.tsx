import styled from '@emotion/styled';
import {
  Banner,
  BannerCloseButton,
  BannerContentWrapper,
} from '@wepublish/banner/website';

const TsriBanner = styled(Banner)(
  ({ theme }) => `

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

  [data-role='PRIMARY'] {
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.common.white};
    border: 2px solid ${theme.palette.common.white};
  }

  [data-role='OTHER'] {
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.common.white};
    border: 2px solid ${theme.palette.common.white};
  }
`
);

export { TsriBanner };
