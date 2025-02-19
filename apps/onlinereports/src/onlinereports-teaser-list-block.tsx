import {BuilderTeaserListBlockProps, TeaserListBlock, useWebsiteBuilder} from '@wepublish/website'
import {css, styled} from '@mui/material'

const ORTeaserListBlockWrapper = styled('div')`
  //grid-column: span 3;
`

export const OnlineReportsTeaserListBlock = (props: BuilderTeaserListBlockProps) => {
  const {
    elements: {H5},
    blocks: {Teaser}
  } = useWebsiteBuilder()

  const teaserListCss = css``

  return <TeaserListBlock {...props} css={teaserListCss} />
}
