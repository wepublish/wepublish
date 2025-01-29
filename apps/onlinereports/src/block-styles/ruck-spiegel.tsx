import {
  alignmentForTeaserBlock,
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass} from 'ramda'

import {Box, styled} from '@mui/material'
import {RuckSpiegelTeaser} from '../custom-teasers/ruck-spiegel'

export const isRuckSpiegelTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('RuckSpiegel'), isTeaserListBlock])(block)

export const RuckSpiegelBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  const {
    elements: {H3}
  } = useWebsiteBuilder()

  return (
    <>
      <RuckSpiegelTeaserListWrapper>
        <H3 gutterBottom>{title}</H3>
        {filledTeasers.map((teaser, index) => (
          <RuckSpiegelTeaser
            key={index}
            teaser={teaser}
            numColumns={numColumns}
            alignment={alignmentForTeaserBlock(index, numColumns)}
            blockStyle={blockStyle}
          />
        ))}
      </RuckSpiegelTeaserListWrapper>
      <Filler />
    </>
  )
}

const RuckSpiegelTeaserListWrapper = styled(Box)`
  padding: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.primary.main};
  display: flex;
  flex-direction: column;
  grid-column: span 3;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: span 2;
    padding: ${({theme}) => theme.spacing(4.5)};
  }
`

const Filler = styled(Box)`
  display: none;

  ${({theme}) => theme.breakpoints.up('md')} {
    display: block;
    grid-column: span 1;
  }
`
