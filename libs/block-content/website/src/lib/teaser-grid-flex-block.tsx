import {css, styled} from '@mui/material'
import {
  Block,
  FlexAlignment,
  TeaserGridFlexBlock as TeaserGridFlexBlockType
} from '@wepublish/website/api'

export const isTeaserGridFlexBlock = (block: Block): block is TeaserGridFlexBlockType =>
  block.__typename === 'TeaserGridFlexBlock'

export const TeaserGridFlexBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 1fr;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`

const Teaser = styled('div')<FlexAlignment>`
  background: ${({theme}) => theme.palette.grey[400]};
  padding: 30px;

  ${({theme, h, w, x, y}) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`

export const TeaserGridFlexBlock = ({
  flexTeasers,
  className
}: TeaserGridFlexBlockType & {className?: string}) => {
  console.log(flexTeasers)

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {flexTeasers?.map((teaser, index) => (
        <Teaser key={index} {...teaser.alignment} />
      ))}
    </TeaserGridFlexBlockWrapper>
  )
}
