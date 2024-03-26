import {Block, TeaserListBlock as TeaserListBlockType} from '@wepublish/website/api'
import {BuilderTeaserListBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {alignmentForTeaserBlock} from './teaser-grid-block'
import {css, styled} from '@mui/material'

export const isTeaserListBlock = (block: Block): block is TeaserListBlockType =>
  block.__typename === 'TeaserListBlock'

export const TeaserListBlockWrapper = styled('div')`
  display: grid;
  column-gap: ${({theme}) => theme.spacing(2)};
  row-gap: ${({theme}) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        grid-template-columns: 1fr 1fr;
      }

      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(12, 1fr);
      }
    `}
`

export const TeaserListBlock = ({teasers, className}: BuilderTeaserListBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  return (
    <TeaserListBlockWrapper className={className}>
      {teasers.map((teaser, index) => (
        <Teaser key={index} teaser={teaser} alignment={alignmentForTeaserBlock(index, 1)} />
      ))}
    </TeaserListBlockWrapper>
  )
}
