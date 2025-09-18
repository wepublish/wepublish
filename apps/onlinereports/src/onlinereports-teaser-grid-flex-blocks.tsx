import styled from '@emotion/styled'
import {
  fixFlexTeasers,
  isTeaserGridFlexBlock,
  omitEmptyFlexTeasers,
  TeaserGridFlexBlockWrapper
} from '@wepublish/block-content/website'
import {BuilderTeaserGridFlexBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'

export const OnlineReportsTeaserGridFlexBlockWrapper = styled(TeaserGridFlexBlockWrapper)`
  row-gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    row-gap: ${({theme}) => theme.spacing(5)};
  }
`

export const OnlineReportsTeaserGridFlexBlock = ({
  flexTeasers,
  blockStyle,
  className
}: BuilderTeaserGridFlexBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  const sortedTeasers = useMemo(
    () => (flexTeasers ? fixFlexTeasers(flexTeasers) : []),
    [flexTeasers]
  )

  return (
    <OnlineReportsTeaserGridFlexBlockWrapper className={className}>
      {sortedTeasers.map((teaser, index) => (
        <Teaser key={index} {...teaser} blockStyle={blockStyle} />
      ))}
    </OnlineReportsTeaserGridFlexBlockWrapper>
  )
}

export {fixFlexTeasers, isTeaserGridFlexBlock, omitEmptyFlexTeasers}
