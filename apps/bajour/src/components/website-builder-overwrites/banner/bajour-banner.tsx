import {styled} from '@mui/material'
import {PageBanner} from '@wepublish/website'
import {BuilderBannerProps} from '@wepublish/website'

const BajourBannerInner = styled(PageBanner.Banner)(
  ({theme}) => `
${PageBanner.BannerContent} {
  padding: ${theme.spacing(2)};
}
${PageBanner.BannerCloseButton} {
  top: ${theme.spacing(2)};
  right: ${theme.spacing(2)};
}
&[data-collapsed='true'] {
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
  ${PageBanner.BannerCta} {
    margin-top: 0;
  }
  ${PageBanner.BannerImage}, ${PageBanner.BannerTitle}, ${PageBanner.BannerText}, ${
    PageBanner.BannerCloseButton
  }, [data-role='CANCEL'], [data-role='OTHER'] {
    display: none;
  }
}`
)

export function BajourBanner(props: BuilderBannerProps) {
  return <BajourBannerInner {...props} />
}
