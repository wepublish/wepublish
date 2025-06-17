import {css} from '@mui/material'
import {BuilderTeaserListBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {TeaserListBlock} from '@wepublish/block-content/website'
import styled from '@emotion/styled'

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
