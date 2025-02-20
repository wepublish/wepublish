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
import {Advertisement} from '../components/advertisement'
import {BlueBox} from '../components/blue-box'
import {GelesenUndGedachtTeaser} from '../custom-teasers/gelesen-und-gedacht'

export const isGelesenUndGedacthTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('Gelesen und Gedacht'), isTeaserListBlock])(block)

export const GelesenUndGedachtBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()

  return (
    <GelesenUndGedachtWrapper>
      <Filler>
        <Advertisement type={'small'} />
      </Filler>
      <BlueBox>
        <TeaserList>
          {filledTeasers.map((teaser, index) => (
            <GelesenUndGedachtTeaser
              key={index}
              teaser={teaser}
              numColumns={numColumns}
              alignment={alignmentForTeaserBlock(index, numColumns)}
              blockStyle={blockStyle}
            />
          ))}
        </TeaserList>
        <Link href={'/a/tag/gelesen-und-gedacht'}>
          <b>Zum Archiv {'->'}</b>
        </Link>
      </BlueBox>
    </GelesenUndGedachtWrapper>
  )
}

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`

const Filler = styled(Box)``

const GelesenUndGedachtWrapper = styled(Box)`
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
