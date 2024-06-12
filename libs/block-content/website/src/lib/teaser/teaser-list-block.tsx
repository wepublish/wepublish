import {Block, TeaserListBlock as TeaserListBlockType} from '@wepublish/website/api'
import {BuilderTeaserListBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {alignmentForTeaserBlock} from './teaser-grid-block'
import {css, styled} from '@mui/material'

export const isTeaserListBlock = (block: Block): block is TeaserListBlockType =>
  block.__typename === 'TeaserListBlock'

export const TeaserListBlockWrapper = styled('section')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const TeaserListBlockTeasers = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
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

export const TeaserListBlock = ({
  title,
  teasers,
  blockStyle,
  className
}: BuilderTeaserListBlockProps) => {
  const {
    elements: {H5},
    blocks: {Teaser}
  } = useWebsiteBuilder()

  return (
    <TeaserListBlockWrapper className={className}>
      {title && <H5 component={'h1'}>{title}</H5>}

      <TeaserListBlockTeasers>
        {teasers.map((teaser, index) => (
          <Teaser
            key={index}
            teaser={teaser}
            alignment={alignmentForTeaserBlock(index, 3)}
            blockStyle={blockStyle}
          />
        ))}
      </TeaserListBlockTeasers>
    </TeaserListBlockWrapper>
  )
}
