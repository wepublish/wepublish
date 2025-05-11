import styled from '@emotion/styled'
import {
  Banner,
  BannerCloseButton,
  BannerContent,
  BannerCta,
  BannerImage,
  BannerText,
  BannerTitle
} from '@wepublish/banner/website'

const BajourBanner = styled(Banner)(
  ({theme}) => `
${BannerContent} {
  padding: ${theme.spacing(2)};
}

${BannerCloseButton} {
  top: ${theme.spacing(2)};
  right: ${theme.spacing(2)};
}

${BannerCta} {
  display: none;
}

&[data-collapsed='true'] {
  top: unset;
  display: block;
  border-radius: 4px;
  grid-template-columns: 1fr;
  position: fixed;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;

  ${theme.breakpoints.up('md')} {
    width: 20%;
  }

  ${BannerCta} {
    display: block;
    margin-top: 0;
  }

  ${BannerImage}, ${BannerTitle}, ${BannerText}, ${BannerCloseButton}, [data-role='CANCEL'], [data-role='OTHER'] {
    display: none;
  }
}`
)

export {BajourBanner}
