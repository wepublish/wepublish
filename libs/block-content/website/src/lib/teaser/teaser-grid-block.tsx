import {css, styled} from '@mui/material'
import {
  Block,
  FlexAlignment,
  Teaser,
  TeaserGridBlock as TeaserGridBlockType
} from '@wepublish/website/api'
import {BuilderTeaserGridBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isTeaserGridBlock = (block: Block): block is TeaserGridBlockType =>
  block.__typename === 'TeaserGridBlock'

export const TeaserGridBlockWrapper = styled('div')<Pick<TeaserGridBlockType, 'numColumns'>>`
  display: grid;
  column-gap: ${({theme}) => theme.spacing(4)};
  row-gap: ${({theme}) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({theme, numColumns}) =>
    numColumns > 1 &&
    css`
      ${theme.breakpoints.up('sm')} {
        grid-template-columns: 1fr 1fr;
      }

      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(12, 1fr);
      }
    `}
`

// @TODO: Have API filter these out by default
export const isFilledTeaser = (teaser: Teaser | null | undefined): teaser is Teaser => {
  switch (teaser?.__typename) {
    case 'ArticleTeaser':
    case 'PeerArticleTeaser': {
      return Boolean(teaser.article)
    }

    case 'PageTeaser': {
      return Boolean(teaser.page)
    }

    case 'EventTeaser': {
      return Boolean(teaser.event)
    }

    case 'CustomTeaser': {
      return Boolean(teaser.contentUrl)
    }
  }

  return false
}

export const alignmentForTeaserBlock = (index: number, numColumns: number): FlexAlignment => {
  const columnIndex = index % numColumns
  const rowIndex = Math.floor(index / numColumns)

  return {
    h: 1,
    w: 12 / numColumns,
    x: (12 / numColumns) * columnIndex,
    y: rowIndex
  }
}

export const TeaserGridBlock = ({numColumns, teasers, className}: BuilderTeaserGridBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  const filledTeasers = teasers.filter(isFilledTeaser)

  return (
    <TeaserGridBlockWrapper className={className} numColumns={numColumns}>
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          numColumns={numColumns}
          alignment={alignmentForTeaserBlock(index, numColumns)}
        />
      ))}
    </TeaserGridBlockWrapper>
  )
}
