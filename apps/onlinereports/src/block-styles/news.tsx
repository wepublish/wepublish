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
          Weitere news
        </Link>
      </NewsTeaserListWrapper>
      <Filler />
    </>
  )
}

const NewsTeaserListWrapper = styled(Box)`
  padding: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.primary.main};
  display: flex;
  flex-direction: column;
  grid-column: span 3;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: span 2;
    padding: ${({theme}) => theme.spacing(4)};
  }
`

const Filler = styled(Box)`
  display: none;

  ${({theme}) => theme.breakpoints.up('md')} {
    display: block;
    grid-column: span 1;
  }
`
