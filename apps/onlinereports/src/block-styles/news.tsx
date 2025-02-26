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

import {NewsTeaser} from '../custom-teasers/news'
import {Box, styled} from '@mui/material'
import {Advertisement} from '../components/advertisement'
import {BlueBox} from '../components/blue-box'

export const isNewsTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block)

export const NewsBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'teasers' | 'title' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1
  const {
    elements: {H2, Link}
  } = useWebsiteBuilder()

  return (
    <>
      <NewsTeaserListWrapper>
        <BlueBox>
          <TeaserList>
            <H2 gutterBottom>{title}</H2>
            {filledTeasers.map((teaser, index) => (
              <NewsTeaser
                key={index}
                teaser={teaser}
                numColumns={numColumns}
                alignment={alignmentForTeaserBlock(index, numColumns)}
                blockStyle={blockStyle}
              />
            ))}
          </TeaserList>
          <Link href={'/a/tag/news'}>
            <b>Weitere news {'->'}</b>
          </Link>
        </BlueBox>

        <Filler>
          <Advertisement type={'small'} />
        </Filler>
      </NewsTeaserListWrapper>
    </>
  )
}

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`

const Filler = styled(Box)``

const NewsTeaserListWrapper = styled(Box)`
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
