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
import {Advertisement} from '../components/advertisement'
import {BlueBox} from '../components/blue-box'

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
    elements: {H2, Link}
  } = useWebsiteBuilder()

  return (
    <RuckSpiegelTeaserListWrapper>
      <BlueBox>
        <TeaserList>
          <H2 gutterBottom>{title}</H2>
          {filledTeasers.map((teaser, index) => (
            <RuckSpiegelTeaser
              key={index}
              teaser={teaser}
              numColumns={numColumns}
              alignment={alignmentForTeaserBlock(index, numColumns)}
              blockStyle={blockStyle}
            />
          ))}
        </TeaserList>
        <Link href={'/a/tag/ruckspiegel'}>
          <b>Zum Archiv {'->'}</b>
        </Link>
      </BlueBox>
      <Filler>
        <Advertisement type={'small'} />
      </Filler>
    </RuckSpiegelTeaserListWrapper>
  )
}

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`

const Filler = styled(Box)``

const RuckSpiegelTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({theme}) => theme.spacing(2.5)};

  ${BlueBox} {
    grid-column: span 3;

    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }
  }

  ${Filler} {
    grid-column: span 3;

    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`
