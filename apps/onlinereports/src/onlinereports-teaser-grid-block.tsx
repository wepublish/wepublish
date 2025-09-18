import styled from '@emotion/styled'
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  isTeaserGridBlock,
  TeaserGridBlockWrapper
} from '@wepublish/block-content/website'
import {BuilderTeaserGridBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const OnlineReportsTeaserGridBlockWrapper = styled(TeaserGridBlockWrapper)`
  row-gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    row-gap: ${({theme}) => theme.spacing(5)};
  }
`

export const OnlineReportsTeaserGridBlock = ({
  numColumns,
  teasers,
  blockStyle,
  className
}: BuilderTeaserGridBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  const filledTeasers = teasers.filter(isFilledTeaser)

  return (
    <OnlineReportsTeaserGridBlockWrapper className={className} numColumns={numColumns}>
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          numColumns={numColumns}
          alignment={alignmentForTeaserBlock(index, numColumns)}
          blockStyle={blockStyle}
        />
      ))}
    </OnlineReportsTeaserGridBlockWrapper>
  )
}

export {alignmentForTeaserBlock, isFilledTeaser, isTeaserGridBlock}
