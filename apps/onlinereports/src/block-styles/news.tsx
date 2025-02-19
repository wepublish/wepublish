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
import {Box, css, styled, useTheme} from '@mui/material'
import {useMemo} from 'react'
import {Advertisement} from '../components/advertisement'

export const isNewsTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block)

const useLinkStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      padding-top: ${theme.spacing(1.5)};
      color: ${theme.palette.accent.contrastText};
    `,
    [theme]
  )
}

export const NewsBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'teasers' | 'title' | 'blockStyle' | 'className'>) => {
  const linkStyles = useLinkStyles()
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1
  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()

  return (
    <>
      <NewsTeaserListWrapper>
        <TeaserList>
          <H3 gutterBottom>{title}</H3>
          {filledTeasers.map((teaser, index) => (
            <NewsTeaser
              key={index}
              teaser={teaser}
              numColumns={numColumns}
              alignment={alignmentForTeaserBlock(index, numColumns)}
              blockStyle={blockStyle}
            />
          ))}
          <Link href={'/a/tag/news'} css={linkStyles}>
            Weitere news {'->'}
          </Link>
        </TeaserList>
        <Filler>
          <Advertisement type={'small'} />
        </Filler>
      </NewsTeaserListWrapper>
    </>
  )
}

const NewsTeaserListWrapper = styled(Box)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2.5)};
  grid-template-columns: 1fr;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, 1fr);
  }
`

const TeaserList = styled('div')`
  grid-column: span 1;
  display: flex;
  flex-direction: column;
  padding: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.primary.main};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: span 2;
    padding: ${({theme}) => theme.spacing(4.5)};
  }
`

const Filler = styled(Box)`
  grid-column: span 1;
`
