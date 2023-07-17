import {css, styled} from '@mui/material'
import {Block, FlexAlignment, TeaserGridBlock as TeaserGridBlockType} from '@wepublish/website/api'
import {BuilderTeaserGridBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isTeaserGridBlock = (block: Block): block is TeaserGridBlockType =>
  block.__typename === 'TeaserGridBlock'

export const TeaserGridBlockWrapper = styled('div')<Pick<TeaserGridBlockType, 'numColumns'>>`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
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

const alignmentForTeaserBlock = (index: number, numColumns: number): FlexAlignment => {
  const columnIndex = index % numColumns
  const rowIndex = Math.floor(index / numColumns)

  return {
    h: 1,
    w: 12 / numColumns,
    x: (12 / numColumns) * columnIndex,
    y: rowIndex
  }
}

export const TeaserGridBlock = ({
  numColumns,
  teasers,
  showLead,
  className
}: BuilderTeaserGridBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  return (
    <TeaserGridBlockWrapper className={className} numColumns={numColumns}>
      {teasers?.map((teaser, index) => (
        <Teaser
          key={index}
          showLead={showLead}
          teaser={teaser}
          alignment={alignmentForTeaserBlock(index, numColumns)}
        />
      ))}
    </TeaserGridBlockWrapper>
  )
}
